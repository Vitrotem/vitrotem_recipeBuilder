from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import hash_password
from app.config import get_settings
from app.database import close_client, get_db
from app.routers import auth, organizations, protocols


async def _rename_collection_if_needed(db, old: str, new: str) -> None:
    names = await db.list_collection_names()
    if old in names and new not in names:
        await db[old].rename(new)


async def seed_and_migrate() -> None:
    settings = get_settings()
    db = get_db()
    now = datetime.now(timezone.utc)

    # Recipe → Protocol collection / GridFS renames
    await _rename_collection_if_needed(db, "recipes", "protocols")
    await _rename_collection_if_needed(db, "recipe_images.files", "protocol_images.files")
    await _rename_collection_if_needed(db, "recipe_images.chunks", "protocol_images.chunks")

    existing = await db.users.find_one(
        {"$or": [{"username_normalized": settings.admin_username.lower()}, {"username": settings.admin_username}]}
    )
    if existing is None:
        await db.users.insert_one(
            {
                "username": settings.admin_username,
                "username_normalized": settings.admin_username.lower(),
                "password_hash": hash_password(settings.admin_password),
                "organization_ids": [],
                "created_at": now,
            }
        )

    # Backfill user fields for legacy documents
    async for user in db.users.find({}):
        updates: dict = {}
        if not user.get("username_normalized"):
            updates["username_normalized"] = str(user.get("username", "")).lower()
        if "organization_ids" not in user:
            updates["organization_ids"] = []
        if "created_at" not in user:
            updates["created_at"] = now
        if updates:
            await db.users.update_one({"_id": user["_id"]}, {"$set": updates})

    admin = await db.users.find_one({"username_normalized": settings.admin_username.lower()})
    admin_id = admin["_id"] if admin else None

    # Legacy entry_type "recipe" (and missing) → "protocol"
    await db.protocols.update_many(
        {"entry_type": {"$in": ["recipe", None]}},
        {"$set": {"entry_type": "protocol"}},
    )
    await db.protocols.update_many(
        {"entry_type": {"$exists": False}},
        {"$set": {"entry_type": "protocol"}},
    )
    # Legacy shared-lab docs become globally visible
    legacy_filter = {"visibility": {"$exists": False}}
    legacy_set: dict = {"visibility": "global"}
    if admin_id is not None:
        legacy_set["owner_id"] = admin_id
    await db.protocols.update_many(legacy_filter, {"$set": legacy_set})

    await db.users.create_index("username_normalized", unique=True)
    await db.organizations.create_index("name_normalized", unique=True)
    await db.organization_invites.create_index("token_hash", unique=True)
    await db.organization_invites.create_index("organization_id")
    await db.protocols.create_index("name")
    await db.protocols.create_index("modality")
    await db.protocols.create_index("tags")
    await db.protocols.create_index("updated_at")
    await db.protocols.create_index("entry_type")
    await db.protocols.create_index([("visibility", 1), ("organization_id", 1)])
    await db.protocols.create_index([("owner_id", 1), ("visibility", 1)])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await seed_and_migrate()
    except Exception as exc:  # noqa: BLE001 — allow boot if Atlas is misconfigured
        print(f"Warning: database seed failed ({exc}). API is up; fix MONGODB_URI and restart.")
    yield
    await close_client()


settings = get_settings()
app = FastAPI(title="VitroTEM Protocol Builder API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(protocols.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

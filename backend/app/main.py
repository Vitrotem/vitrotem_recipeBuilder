from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import hash_password
from app.config import get_settings
from app.database import close_client, get_db
from app.routers import auth, organizations, recipes


async def seed_and_migrate() -> None:
    settings = get_settings()
    db = get_db()
    now = datetime.now(timezone.utc)

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

    await db.recipes.update_many(
        {"entry_type": {"$exists": False}},
        {"$set": {"entry_type": "recipe"}},
    )
    # Legacy shared-lab docs become globally visible
    legacy_filter = {"visibility": {"$exists": False}}
    legacy_set: dict = {"visibility": "global"}
    if admin_id is not None:
        legacy_set["owner_id"] = admin_id
    await db.recipes.update_many(legacy_filter, {"$set": legacy_set})

    await db.users.create_index("username_normalized", unique=True)
    await db.organizations.create_index("name_normalized", unique=True)
    await db.organization_invites.create_index("token_hash", unique=True)
    await db.organization_invites.create_index("organization_id")
    await db.recipes.create_index("name")
    await db.recipes.create_index("modality")
    await db.recipes.create_index("tags")
    await db.recipes.create_index("updated_at")
    await db.recipes.create_index("entry_type")
    await db.recipes.create_index([("visibility", 1), ("organization_id", 1)])
    await db.recipes.create_index([("owner_id", 1), ("visibility", 1)])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await seed_and_migrate()
    except Exception as exc:  # noqa: BLE001 — allow boot if Atlas is misconfigured
        print(f"Warning: database seed failed ({exc}). API is up; fix MONGODB_URI and restart.")
    yield
    await close_client()


settings = get_settings()
app = FastAPI(title="VitroTEM Recipe Builder API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(recipes.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import hash_password
from app.config import get_settings
from app.database import close_client, get_db
from app.routers import auth, recipes


async def seed_admin() -> None:
    settings = get_settings()
    db = get_db()
    existing = await db.users.find_one({"username": settings.admin_username})
    if existing is None:
        await db.users.insert_one(
            {
                "username": settings.admin_username,
                "password_hash": hash_password(settings.admin_password),
            }
        )
    await db.recipes.create_index("name")
    await db.recipes.create_index("modality")
    await db.recipes.create_index("tags")
    await db.recipes.create_index("updated_at")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await seed_admin()
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
app.include_router(recipes.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

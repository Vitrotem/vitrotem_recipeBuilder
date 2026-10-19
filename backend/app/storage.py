from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from app.database import get_db

_bucket: AsyncIOMotorGridFSBucket | None = None


def get_fs() -> AsyncIOMotorGridFSBucket:
    global _bucket
    if _bucket is None:
        _bucket = AsyncIOMotorGridFSBucket(get_db(), bucket_name="recipe_images")
    return _bucket

from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from app.database import get_db

_protocol_bucket: AsyncIOMotorGridFSBucket | None = None
_org_icon_bucket: AsyncIOMotorGridFSBucket | None = None


def get_fs() -> AsyncIOMotorGridFSBucket:
    global _protocol_bucket
    if _protocol_bucket is None:
        _protocol_bucket = AsyncIOMotorGridFSBucket(get_db(), bucket_name="protocol_images")
    return _protocol_bucket


def get_org_icon_fs() -> AsyncIOMotorGridFSBucket:
    global _org_icon_bucket
    if _org_icon_bucket is None:
        _org_icon_bucket = AsyncIOMotorGridFSBucket(get_db(), bucket_name="organization_icons")
    return _org_icon_bucket

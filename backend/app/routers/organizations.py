import asyncio
import hashlib
import io
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from gridfs.errors import NoFile
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.images import resize_to_icon
from app.models import (
    InviteAcceptRequest,
    InviteCreateResponse,
    OrganizationCreate,
    OrganizationMember,
    OrganizationOut,
)
from app.storage import get_org_icon_fs

router = APIRouter(prefix="/organizations", tags=["organizations"])

ALLOWED_ICON_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_ICON_BYTES = 5 * 1024 * 1024


def _parse_oid(value: str, label: str = "Resource") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail=f"{label} not found") from exc


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _org_out(org: dict) -> OrganizationOut:
    icon_id = org.get("icon_id")
    return OrganizationOut(
        id=str(org["_id"]),
        name=org["name"],
        created_at=org["created_at"],
        icon_id=str(icon_id) if icon_id else None,
    )


async def _require_member(org_id: str, user: dict) -> ObjectId:
    oid = _parse_oid(org_id, "Organization")
    org = await get_db().organizations.find_one({"_id": oid})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    member_ids = {str(x) for x in (user.get("organization_ids") or [])}
    if org_id not in member_ids:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return oid


@router.get("", response_model=list[OrganizationOut])
async def list_my_organizations(user: dict = Depends(get_current_user)) -> list[OrganizationOut]:
    db = get_db()
    org_ids = user.get("organization_ids") or []
    if not org_ids:
        return []
    out: list[OrganizationOut] = []
    cursor = db.organizations.find({"_id": {"$in": org_ids}})
    async for org in cursor:
        out.append(_org_out(org))
    return out


@router.post("", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
async def create_organization(
    body: OrganizationCreate,
    user: dict = Depends(get_current_user),
) -> OrganizationOut:
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name,
        "name_normalized": body.name.lower(),
        "created_by": ObjectId(user["id"]),
        "created_at": now,
        "icon_id": None,
    }
    try:
        result = await db.organizations.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization name already taken",
        ) from exc

    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$addToSet": {"organization_ids": result.inserted_id}},
    )
    return OrganizationOut(
        id=str(result.inserted_id),
        name=body.name,
        created_at=now,
        icon_id=None,
    )


@router.post("/invites/accept", response_model=OrganizationOut)
async def accept_invite(
    body: InviteAcceptRequest,
    user: dict = Depends(get_current_user),
) -> OrganizationOut:
    db = get_db()
    token = (body.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Invite token is required")

    invite = await db.organization_invites.find_one({"token_hash": _hash_token(token)})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.get("used_at") is not None:
        raise HTTPException(status_code=409, detail="Invite has already been used")

    expires_at = invite.get("expires_at")
    now = datetime.now(timezone.utc)
    if expires_at is not None:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(status_code=410, detail="Invite has expired")

    org_id = invite["organization_id"]
    org = await db.organizations.find_one({"_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    result = await db.organization_invites.update_one(
        {"_id": invite["_id"], "used_at": None},
        {
            "$set": {
                "used_at": now,
                "used_by": ObjectId(user["id"]),
            }
        },
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="Invite has already been used")

    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$addToSet": {"organization_ids": org_id}},
    )
    return _org_out(org)


@router.get("/{org_id}/members", response_model=list[OrganizationMember])
async def list_members(
    org_id: str,
    user: dict = Depends(get_current_user),
) -> list[OrganizationMember]:
    db = get_db()
    oid = await _require_member(org_id, user)

    out: list[OrganizationMember] = []
    cursor = db.users.find(
        {"organization_ids": oid},
        {"username": 1},
    ).sort("username_normalized", 1)
    async for member in cursor:
        out.append(
            OrganizationMember(
                id=str(member["_id"]),
                username=member["username"],
            )
        )
    return out


@router.post(
    "/{org_id}/invites",
    response_model=InviteCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite(
    org_id: str,
    user: dict = Depends(get_current_user),
) -> InviteCreateResponse:
    db = get_db()
    oid = await _require_member(org_id, user)

    settings = get_settings()
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.invite_expire_days)
    await db.organization_invites.insert_one(
        {
            "organization_id": oid,
            "token_hash": _hash_token(token),
            "created_by": ObjectId(user["id"]),
            "created_at": now,
            "expires_at": expires_at,
            "used_at": None,
            "used_by": None,
        }
    )
    return InviteCreateResponse(token=token, expires_at=expires_at)


@router.post("/{org_id}/icon", response_model=OrganizationOut)
async def upload_organization_icon(
    org_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> OrganizationOut:
    db = get_db()
    oid = await _require_member(org_id, user)
    org = await db.organizations.find_one({"_id": oid})
    assert org is not None

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_ICON_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_ICON_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5 MB or smaller")

    try:
        resized, out_type = await asyncio.to_thread(resize_to_icon, data, 100)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid image file") from exc

    fs = get_org_icon_fs()
    old_icon_id = org.get("icon_id")
    if old_icon_id:
        try:
            await fs.delete(ObjectId(str(old_icon_id)))
        except (InvalidId, NoFile):
            pass

    file_id = await fs.upload_from_stream(
        file.filename or "icon.png",
        io.BytesIO(resized),
        metadata={
            "organization_id": org_id,
            "content_type": out_type,
        },
    )

    updated = await db.organizations.find_one_and_update(
        {"_id": oid},
        {"$set": {"icon_id": file_id}},
        return_document=ReturnDocument.AFTER,
    )
    assert updated is not None
    return _org_out(updated)


@router.get("/{org_id}/icon")
async def get_organization_icon(
    org_id: str,
    user: dict = Depends(get_current_user),
) -> Response:
    db = get_db()
    oid = await _require_member(org_id, user)
    org = await db.organizations.find_one({"_id": oid})
    assert org is not None

    icon_id = org.get("icon_id")
    if not icon_id:
        raise HTTPException(status_code=404, detail="Organization has no icon")

    fs = get_org_icon_fs()
    try:
        grid_out = await fs.open_download_stream(ObjectId(str(icon_id)))
        raw = await grid_out.read()
        meta_type = (grid_out.metadata or {}).get("content_type") or "image/png"
    except (InvalidId, NoFile) as exc:
        raise HTTPException(status_code=404, detail="Icon not found") from exc

    return Response(
        content=raw,
        media_type=meta_type,
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.delete("/{org_id}/icon", response_model=OrganizationOut)
async def delete_organization_icon(
    org_id: str,
    user: dict = Depends(get_current_user),
) -> OrganizationOut:
    db = get_db()
    oid = await _require_member(org_id, user)
    org = await db.organizations.find_one({"_id": oid})
    assert org is not None

    icon_id = org.get("icon_id")
    if icon_id:
        fs = get_org_icon_fs()
        try:
            await fs.delete(ObjectId(str(icon_id)))
        except (InvalidId, NoFile):
            pass

    updated = await db.organizations.find_one_and_update(
        {"_id": oid},
        {"$set": {"icon_id": None}},
        return_document=ReturnDocument.AFTER,
    )
    assert updated is not None
    return _org_out(updated)

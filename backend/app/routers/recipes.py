import io
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from gridfs.errors import NoFile
from pymongo import ReturnDocument

from app.auth import get_current_user
from app.crypto import (
    CONTENT_FIELDS,
    decrypt_bytes,
    encrypt_bytes,
    recipe_from_storage,
    recipe_to_storage,
)
from app.database import get_db
from app.models import (
    EntryTypeUpdate,
    RecipeCreate,
    RecipeImage,
    RecipeOut,
    RecipeUpdate,
    Visibility,
)
from app.storage import get_fs

router = APIRouter(prefix="/recipes", tags=["recipes"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _parse_oid(value: str, label: str = "Resource") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail=f"{label} not found") from exc


def _serialize_images(raw: list[dict[str, Any]] | None) -> list[RecipeImage]:
    images: list[RecipeImage] = []
    for item in raw or []:
        images.append(
            RecipeImage(
                id=str(item.get("id") or item.get("_id") or ""),
                filename=item.get("filename") or "image",
                content_type=item.get("content_type") or "application/octet-stream",
                caption=item.get("caption"),
                kind=item.get("kind"),
                size_bytes=int(item.get("size_bytes") or 0),
                created_at=item.get("created_at") or datetime.now(timezone.utc),
            )
        )
    return images


def _serialize(doc: dict[str, Any]) -> RecipeOut:
    plain = recipe_from_storage(doc)
    visibility = plain.get("visibility") or "global"
    owner_id = plain.get("owner_id")
    org_id = plain.get("organization_id")
    return RecipeOut(
        id=str(plain["_id"]),
        name=plain["name"],
        entry_type=plain.get("entry_type") or "recipe",
        modality=plain.get("modality", "cryo"),
        author=plain.get("author"),
        tags=plain.get("tags") or [],
        notes=plain.get("notes"),
        plasma=plain.get("plasma") or {},
        naiad=plain.get("naiad") or {},
        sample=plain.get("sample") or {},
        grid=plain.get("grid") or {},
        graphene=plain.get("graphene") or {},
        microscope=plain.get("microscope") or {},
        outcome=plain.get("outcome") or {},
        visibility=visibility,
        organization_id=str(org_id) if org_id else None,
        owner_id=str(owner_id) if owner_id else None,
        images=_serialize_images(plain.get("images")),
        created_at=plain["created_at"],
        updated_at=plain["updated_at"],
    )


def _user_can_access(doc: dict[str, Any], user: dict[str, Any]) -> bool:
    visibility = doc.get("visibility") or "global"
    if visibility == "global":
        return True
    owner_id = doc.get("owner_id")
    if visibility == "private":
        return owner_id is not None and str(owner_id) == user["id"]
    if visibility == "organization":
        org_id = doc.get("organization_id")
        if org_id is None:
            return False
        return org_id in (user.get("organization_ids") or [])
    return False


def _user_can_mutate(doc: dict[str, Any], user: dict[str, Any]) -> bool:
    """Owner can always edit; org members can edit org-visible entries; anyone can edit global (lab shared)."""
    visibility = doc.get("visibility") or "global"
    owner_id = doc.get("owner_id")
    if owner_id is not None and str(owner_id) == user["id"]:
        return True
    if visibility == "global":
        return True
    if visibility == "organization":
        org_id = doc.get("organization_id")
        return org_id is not None and org_id in (user.get("organization_ids") or [])
    return False


def _require_access(doc: dict[str, Any] | None, user: dict[str, Any]) -> dict[str, Any]:
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not _user_can_access(doc, user):
        raise HTTPException(status_code=403, detail="Not allowed to access this entry")
    return doc


def _require_mutate(doc: dict[str, Any] | None, user: dict[str, Any]) -> dict[str, Any]:
    doc = _require_access(doc, user)
    if not _user_can_mutate(doc, user):
        raise HTTPException(status_code=403, detail="Not allowed to modify this entry")
    return doc


def _acl_filter(user: dict[str, Any], scope: str | None) -> dict[str, Any]:
    my_orgs = user.get("organization_ids") or []
    my_id = ObjectId(user["id"])

    if scope == "personal":
        return {"visibility": "private", "owner_id": my_id}
    if scope == "organization":
        if not my_orgs:
            return {"_id": {"$exists": False}}  # match nothing
        return {"visibility": "organization", "organization_id": {"$in": my_orgs}}
    if scope == "global":
        return {"visibility": "global"}

    # Default: anything the user can see
    return {
        "$or": [
            {"visibility": "global"},
            {"visibility": "private", "owner_id": my_id},
            {"visibility": "organization", "organization_id": {"$in": my_orgs}},
            # Legacy docs without visibility
            {"visibility": {"$exists": False}},
        ]
    }


async def _validate_visibility(
    visibility: Visibility,
    organization_id: str | None,
    user: dict[str, Any],
) -> ObjectId | None:
    if visibility == Visibility.organization:
        if not organization_id:
            raise HTTPException(
                status_code=400,
                detail="organization_id is required when visibility is organization",
            )
        oid = _parse_oid(organization_id, "Organization")
        if oid not in (user.get("organization_ids") or []):
            raise HTTPException(
                status_code=403,
                detail="You are not a member of that organization",
            )
        org = await get_db().organizations.find_one({"_id": oid})
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return oid
    return None


def _recipe_payload(body: RecipeCreate | RecipeUpdate) -> dict[str, Any]:
    return body.model_dump(mode="json")


async def _delete_gridfs_files(file_ids: list[str]) -> None:
    fs = get_fs()
    for file_id in file_ids:
        try:
            await fs.delete(ObjectId(file_id))
        except (InvalidId, NoFile):
            continue


@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    q: str | None = Query(None),
    modality: str | None = Query(None),
    tag: str | None = Query(None),
    entry_type: str | None = Query(None),
    scope: str | None = Query(None, pattern="^(personal|organization|global)$"),
    user: dict = Depends(get_current_user),
) -> list[RecipeOut]:
    db = get_db()
    filters: dict[str, Any] = dict(_acl_filter(user, scope))

    and_clauses: list[dict[str, Any]] = []
    if modality:
        and_clauses.append({"modality": modality})
    if tag:
        and_clauses.append({"tags": tag})
    if entry_type == "log":
        and_clauses.append({"entry_type": "log"})
    elif entry_type == "recipe":
        and_clauses.append(
            {"$or": [{"entry_type": "recipe"}, {"entry_type": {"$exists": False}}]}
        )
    if q:
        and_clauses.append(
            {
                "$or": [
                    {"name": {"$regex": q, "$options": "i"}},
                    {"author": {"$regex": q, "$options": "i"}},
                    {"tags": {"$regex": q, "$options": "i"}},
                ]
            }
        )

    if and_clauses:
        # Merge ACL with extra filters
        if "$or" in filters and len(filters) == 1:
            filters = {"$and": [filters, *and_clauses]}
        else:
            filters = {"$and": [filters, *and_clauses]} if filters else {"$and": and_clauses}

    cursor = db.recipes.find(filters).sort("updated_at", -1)
    return [_serialize(doc) async for doc in cursor]


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    body: RecipeCreate,
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    org_oid = await _validate_visibility(body.visibility, body.organization_id, user)
    now = datetime.now(timezone.utc)
    payload = _recipe_payload(body)
    payload["visibility"] = body.visibility.value
    payload["organization_id"] = org_oid
    payload["owner_id"] = ObjectId(user["id"])
    doc = recipe_to_storage(payload)
    doc["images"] = []
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.recipes.insert_one(doc)
    saved = await db.recipes.find_one({"_id": result.inserted_id})
    assert saved is not None
    return _serialize(saved)


@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: str,
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    return _serialize(_require_access(doc, user))


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: str,
    body: RecipeUpdate,
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    existing = await db.recipes.find_one({"_id": oid})
    _require_mutate(existing, user)

    org_oid = await _validate_visibility(body.visibility, body.organization_id, user)
    payload = _recipe_payload(body)
    payload["visibility"] = body.visibility.value
    payload["organization_id"] = org_oid
    # Preserve original owner
    payload["owner_id"] = existing.get("owner_id") or ObjectId(user["id"])
    update = recipe_to_storage(payload)
    update["updated_at"] = datetime.now(timezone.utc)
    # Never overwrite images via PUT
    update.pop("images", None)

    result = await db.recipes.find_one_and_update(
        {"_id": oid},
        {
            "$set": update,
            # Drop legacy plaintext content fields once encrypted
            "$unset": {field: "" for field in CONTENT_FIELDS},
        },
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize(result)


@router.patch("/{recipe_id}/entry-type", response_model=RecipeOut)
async def set_entry_type(
    recipe_id: str,
    body: EntryTypeUpdate,
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    existing = await db.recipes.find_one({"_id": oid})
    _require_mutate(existing, user)
    result = await db.recipes.find_one_and_update(
        {"_id": oid},
        {
            "$set": {
                "entry_type": body.entry_type.value,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize(result)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    _require_mutate(doc, user)
    image_ids = [str(img.get("id")) for img in (doc.get("images") or []) if img.get("id")]
    await _delete_gridfs_files(image_ids)
    await db.recipes.delete_one({"_id": oid})


@router.post("/{recipe_id}/images", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def upload_recipe_image(
    recipe_id: str,
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    kind: str | None = Form(None),
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    _require_mutate(doc, user)

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5 MB or smaller")

    encrypted = encrypt_bytes(data)
    filename = file.filename or "image"
    fs = get_fs()
    file_id = await fs.upload_from_stream(
        filename,
        io.BytesIO(encrypted),
        metadata={
            "recipe_id": recipe_id,
            "content_type": content_type,
            "caption": caption,
            "kind": kind,
            "encrypted": True,
        },
    )

    now = datetime.now(timezone.utc)
    image_meta = {
        "id": str(file_id),
        "filename": filename,
        "content_type": content_type,
        "caption": caption or None,
        "kind": kind or None,
        "size_bytes": len(data),
        "created_at": now,
    }

    updated = await db.recipes.find_one_and_update(
        {"_id": oid},
        {
            "$push": {"images": image_meta},
            "$set": {"updated_at": now},
        },
        return_document=ReturnDocument.AFTER,
    )
    assert updated is not None
    return _serialize(updated)


@router.get("/{recipe_id}/images/{image_id}")
async def get_recipe_image(
    recipe_id: str,
    image_id: str,
    user: dict = Depends(get_current_user),
) -> Response:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    img_oid = _parse_oid(image_id, "Image")

    doc = await db.recipes.find_one({"_id": oid})
    _require_access(doc, user)

    meta = next((img for img in (doc.get("images") or []) if str(img.get("id")) == image_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail="Image not found")

    fs = get_fs()
    try:
        grid_out = await fs.open_download_stream(img_oid)
        raw = await grid_out.read()
    except NoFile as exc:
        raise HTTPException(status_code=404, detail="Image not found") from exc

    data = decrypt_bytes(raw)
    content_type = meta.get("content_type") or "application/octet-stream"
    filename = meta.get("filename") or "image"

    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.delete("/{recipe_id}/images/{image_id}", response_model=RecipeOut)
async def delete_recipe_image(
    recipe_id: str,
    image_id: str,
    user: dict = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    _require_mutate(doc, user)

    meta = next((img for img in (doc.get("images") or []) if str(img.get("id")) == image_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail="Image not found")

    await _delete_gridfs_files([image_id])
    updated = await db.recipes.find_one_and_update(
        {"_id": oid},
        {
            "$pull": {"images": {"id": image_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        return_document=ReturnDocument.AFTER,
    )
    assert updated is not None
    return _serialize(updated)

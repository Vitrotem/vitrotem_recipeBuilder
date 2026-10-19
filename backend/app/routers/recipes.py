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
from app.database import get_db
from app.models import RecipeCreate, RecipeImage, RecipeOut, RecipeUpdate
from app.storage import get_fs

router = APIRouter(prefix="/recipes", tags=["recipes"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


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
    return RecipeOut(
        id=str(doc["_id"]),
        name=doc["name"],
        modality=doc.get("modality", "cryo"),
        author=doc.get("author"),
        tags=doc.get("tags") or [],
        notes=doc.get("notes"),
        plasma=doc.get("plasma") or {},
        naiad=doc.get("naiad") or {},
        sample=doc.get("sample") or {},
        grid=doc.get("grid") or {},
        graphene=doc.get("graphene") or {},
        microscope=doc.get("microscope") or {},
        outcome=doc.get("outcome") or {},
        images=_serialize_images(doc.get("images")),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def _recipe_doc(payload: RecipeCreate | RecipeUpdate) -> dict[str, Any]:
    # Never include images — managed only by image endpoints
    return payload.model_dump()


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
    _user: str = Depends(get_current_user),
) -> list[RecipeOut]:
    db = get_db()
    filters: dict[str, Any] = {}
    if modality:
        filters["modality"] = modality
    if tag:
        filters["tags"] = tag
    if q:
        filters["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"author": {"$regex": q, "$options": "i"}},
            {"notes": {"$regex": q, "$options": "i"}},
            {"sample.subtype": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.recipes.find(filters).sort("updated_at", -1)
    return [_serialize(doc) async for doc in cursor]


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    body: RecipeCreate,
    _user: str = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = _recipe_doc(body)
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
    _user: str = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize(doc)


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: str,
    body: RecipeUpdate,
    _user: str = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    update = _recipe_doc(body)
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.recipes.find_one_and_update(
        {"_id": oid},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _serialize(result)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    _user: str = Depends(get_current_user),
) -> None:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")
    image_ids = [str(img.get("id")) for img in (doc.get("images") or []) if img.get("id")]
    await _delete_gridfs_files(image_ids)
    await db.recipes.delete_one({"_id": oid})


@router.post("/{recipe_id}/images", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def upload_recipe_image(
    recipe_id: str,
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    kind: str | None = Form(None),
    _user: str = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")

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
        raise HTTPException(status_code=400, detail="Image must be 8 MB or smaller")

    filename = file.filename or "image"
    fs = get_fs()
    file_id = await fs.upload_from_stream(
        filename,
        io.BytesIO(data),
        metadata={
            "recipe_id": recipe_id,
            "content_type": content_type,
            "caption": caption,
            "kind": kind,
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
    _user: str = Depends(get_current_user),
) -> Response:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    img_oid = _parse_oid(image_id, "Image")

    doc = await db.recipes.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")

    meta = next((img for img in (doc.get("images") or []) if str(img.get("id")) == image_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail="Image not found")

    fs = get_fs()
    try:
        grid_out = await fs.open_download_stream(img_oid)
        data = await grid_out.read()
    except NoFile as exc:
        raise HTTPException(status_code=404, detail="Image not found") from exc

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
    _user: str = Depends(get_current_user),
) -> RecipeOut:
    db = get_db()
    oid = _parse_oid(recipe_id, "Recipe")
    doc = await db.recipes.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")

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

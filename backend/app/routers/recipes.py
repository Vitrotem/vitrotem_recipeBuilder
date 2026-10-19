from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument

from app.auth import get_current_user
from app.database import get_db
from app.models import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter(prefix="/recipes", tags=["recipes"])


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
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def _recipe_doc(payload: RecipeCreate | RecipeUpdate) -> dict[str, Any]:
    return payload.model_dump()


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
    try:
        oid = ObjectId(recipe_id)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail="Recipe not found") from exc
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
    try:
        oid = ObjectId(recipe_id)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail="Recipe not found") from exc
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
    try:
        oid = ObjectId(recipe_id)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail="Recipe not found") from exc
    result = await db.recipes.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")

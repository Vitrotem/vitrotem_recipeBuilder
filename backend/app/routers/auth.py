from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import (
    LoginRequest,
    MeOrganization,
    MeResponse,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest) -> TokenResponse:
    db = get_db()
    now = datetime.now(timezone.utc)
    username_normalized = body.username.lower()
    doc = {
        "username": body.username,
        "username_normalized": username_normalized,
        "password_hash": hash_password(body.password),
        "organization_ids": [],
        "created_at": now,
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        ) from exc
    token = create_access_token(str(result.inserted_id), body.username)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    db = get_db()
    user = await db.users.find_one({"username_normalized": body.username.strip().lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(str(user["_id"]), user["username"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
async def me(user: dict = Depends(get_current_user)) -> MeResponse:
    db = get_db()
    org_ids = user.get("organization_ids") or []
    orgs: list[MeOrganization] = []
    if org_ids:
        cursor = db.organizations.find({"_id": {"$in": org_ids}})
        async for org in cursor:
            icon_id = org.get("icon_id")
            orgs.append(
                MeOrganization(
                    id=str(org["_id"]),
                    name=org["name"],
                    icon_id=str(icon_id) if icon_id else None,
                )
            )
        # Stable order matching membership list where possible
        order = {str(oid): i for i, oid in enumerate(org_ids)}
        orgs.sort(key=lambda o: order.get(o.id, 999))
    return MeResponse(id=user["id"], username=user["username"], organizations=orgs)

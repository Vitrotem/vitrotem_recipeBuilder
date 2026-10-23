"""Server-side encryption at rest for protocol content and images."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings

CONTENT_FIELDS = (
    "notes",
    "plasma",
    "naiad",
    "sample",
    "grid",
    "graphene",
    "microscope",
    "outcome",
)


@lru_cache
def _fernet() -> Fernet:
    settings = get_settings()
    key = (settings.data_encryption_key or "").strip()
    if not key:
        # Dev fallback — generate a stable-enough key from jwt_secret so local boots work.
        # Production must set DATA_ENCRYPTION_KEY.
        import base64
        import hashlib

        digest = hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest).decode("ascii")
    return Fernet(key.encode("ascii") if isinstance(key, str) else key)


def encrypt_string(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt_string(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode("ascii")).decode("utf-8")


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    try:
        return _fernet().decrypt(data)
    except InvalidToken:
        # Legacy unencrypted GridFS blobs
        return data


def pack_content(payload: dict[str, Any]) -> str:
    blob = {field: payload.get(field) for field in CONTENT_FIELDS}
    return encrypt_string(json.dumps(blob, default=str))


def unpack_content(content_enc: str) -> dict[str, Any]:
    raw = json.loads(decrypt_string(content_enc))
    return {field: raw.get(field) for field in CONTENT_FIELDS}


def protocol_to_storage(payload: dict[str, Any]) -> dict[str, Any]:
    """Split plaintext metadata from encrypted content for MongoDB storage."""
    doc = {k: v for k, v in payload.items() if k not in CONTENT_FIELDS}
    doc["content_enc"] = pack_content(payload)
    for field in CONTENT_FIELDS:
        doc.pop(field, None)
    return doc


def protocol_from_storage(doc: dict[str, Any]) -> dict[str, Any]:
    """Merge decrypted content into a protocol document for API responses."""
    out = dict(doc)
    content_enc = out.pop("content_enc", None)
    if content_enc:
        out.update(unpack_content(content_enc))
    else:
        # Legacy plaintext documents
        for field in CONTENT_FIELDS:
            out.setdefault(field, None if field == "notes" else {})
    return out

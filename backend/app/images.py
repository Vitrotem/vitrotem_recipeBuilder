"""Image helpers for uploads (org icons, etc.)."""

from __future__ import annotations

import io

from PIL import Image


def resize_to_icon(data: bytes, size: int = 100) -> tuple[bytes, str]:
    """Resize image to an exact size×size PNG (cover-crop centered)."""
    with Image.open(io.BytesIO(data)) as img:
        img = img.convert("RGBA")
        # Cover crop to square, then resize
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="PNG", optimize=True)
        return out.getvalue(), "image/png"

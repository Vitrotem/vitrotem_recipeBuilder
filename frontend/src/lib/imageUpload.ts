export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "5 MB";
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXT_TO_TYPE: Record<string, (typeof ACCEPTED_IMAGE_TYPES)[number]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export type PendingImage = {
  localId: string;
  file: File;
  caption: string;
  kind: string;
  previewUrl: string;
};

/** Resolve MIME even when the OS leaves `file.type` empty (common on Windows drops). */
export function resolveImageType(file: File): (typeof ACCEPTED_IMAGE_TYPES)[number] | null {
  const raw = (file.type || "").toLowerCase();
  if (raw === "image/jpg") return "image/jpeg";
  if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(raw)) {
    return raw as (typeof ACCEPTED_IMAGE_TYPES)[number];
  }
  const dot = file.name.lastIndexOf(".");
  if (dot < 0) return null;
  return EXT_TO_TYPE[file.name.slice(dot).toLowerCase()] ?? null;
}

export function validateImageFile(file: File): string | null {
  if (!resolveImageType(file)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be ${MAX_IMAGE_LABEL} or smaller`;
  }
  return null;
}

export function createPendingImage(
  file: File,
  opts: { caption?: string; kind?: string } = {},
): PendingImage {
  return {
    localId: crypto.randomUUID(),
    file,
    caption: opts.caption?.trim() || "",
    kind: opts.kind || "micrograph",
    previewUrl: URL.createObjectURL(file),
  };
}

export function revokePendingImages(pending: PendingImage[]) {
  pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
}

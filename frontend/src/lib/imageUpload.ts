export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "5 MB";
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PendingImage = {
  localId: string;
  file: File;
  caption: string;
  kind: string;
  previewUrl: string;
};

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
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

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteRecipeImage,
  fetchRecipeImageBlob,
  uploadRecipeImage,
} from "@/lib/api";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_LABEL,
  createPendingImage,
  validateImageFile,
  type PendingImage,
} from "@/lib/imageUpload";
import type { Recipe, RecipeImage } from "@/lib/types";

const IMAGE_KINDS = [
  { value: "micrograph", label: "Micrograph" },
  { value: "overview", label: "Overview" },
  { value: "qc", label: "QC" },
  { value: "other", label: "Other" },
];

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

type Props = {
  recipeId?: string;
  images?: RecipeImage[];
  onChange?: (recipe: Recipe) => void;
  pending?: PendingImage[];
  onPendingChange?: (pending: PendingImage[]) => void;
  readOnly?: boolean;
};

export default function RecipeImages({
  recipeId,
  images = [],
  onChange,
  pending = [],
  onPendingChange,
  readOnly = false,
}: Props) {
  const isPendingMode = Boolean(onPendingChange) && !recipeId;
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState("micrograph");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

  const imageKey = images.map((i) => i.id).join(",");
  const lightboxImage = isPendingMode
    ? pending.find((i) => i.localId === lightboxId) || null
    : images.find((i) => i.id === lightboxId) || null;
  const lightboxSrc = lightboxId
    ? isPendingMode
      ? pending.find((i) => i.localId === lightboxId)?.previewUrl
      : previews[lightboxId]
    : null;

  useEffect(() => {
    if (isPendingMode || !recipeId) return;
    let cancelled = false;

    async function loadPreviews() {
      const next: Record<string, string> = {};
      for (const img of images) {
        try {
          const blob = await fetchRecipeImageBlob(recipeId!, img.id);
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          objectUrls.current.push(url);
          next[img.id] = url;
        } catch {
          /* skip broken */
        }
      }
      if (!cancelled) setPreviews(next);
    }

    objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.current = [];
    setPreviews({});
    if (images.length) void loadPreviews();

    return () => {
      cancelled = true;
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current = [];
    };
  }, [recipeId, imageKey, isPendingMode]);

  useEffect(() => {
    if (!lightboxId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxId(null);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxId]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isPendingMode && onPendingChange) {
      const next = createPendingImage(file, {
        caption: caption.trim() || undefined,
        kind: kind || undefined,
      });
      onPendingChange([...pending, next]);
      setCaption("");
      return;
    }

    if (!recipeId || !onChange) return;

    setUploading(true);
    try {
      const updated = await uploadRecipeImage(recipeId, file, {
        caption: caption.trim() || undefined,
        kind: kind || undefined,
      });
      setCaption("");
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;
    setError(null);

    if (isPendingMode && onPendingChange) {
      if (lightboxId === imageId) setLightboxId(null);
      const target = pending.find((p) => p.localId === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      onPendingChange(pending.filter((p) => p.localId !== imageId));
      return;
    }

    if (!recipeId || !onChange) return;

    try {
      if (lightboxId === imageId) setLightboxId(null);
      const updated = await deleteRecipeImage(recipeId, imageId);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const empty = isPendingMode ? pending.length === 0 : images.length === 0;

  return (
    <section className="form-section recipe-images">
      <h2>Images</h2>
      {!readOnly && (
        <p className="images-hint">
          JPEG, PNG, or WebP — max {MAX_IMAGE_LABEL} each
          {isPendingMode ? ". Uploaded when you save." : "."}
        </p>
      )}
      {error && <div className="alert">{error}</div>}

      {!readOnly && (
        <div className="images-upload grid-2">
          <label>
            Kind
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {IMAGE_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Caption (optional)
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. square 3, thin ice"
            />
          </label>
          <label className="file-label">
            Upload image
            <input
              type="file"
              accept={ACCEPT}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                void handleFile(f);
              }}
            />
          </label>
          {uploading && <p className="images-status">Uploading…</p>}
        </div>
      )}

      {empty ? (
        <p className="images-empty">{readOnly ? "No images attached." : "No images yet."}</p>
      ) : (
        <ul className="image-grid">
          {isPendingMode
            ? pending.map((img) => (
                <li key={img.localId} className="image-card">
                  <button
                    type="button"
                    className="image-thumb image-thumb-btn"
                    onClick={() => setLightboxId(img.localId)}
                    aria-label={`Preview ${img.caption || img.file.name}`}
                  >
                    <img src={img.previewUrl} alt={img.caption || img.file.name} />
                  </button>
                  <div className="image-meta">
                    <strong>{img.kind || "image"}</strong>
                    <span>{img.caption || img.file.name}</span>
                    <span className="image-size">{(img.file.size / 1024).toFixed(0)} KB</span>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => void handleDelete(img.localId)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))
            : images.map((img) => (
                <li key={img.id} className="image-card">
                  <button
                    type="button"
                    className="image-thumb image-thumb-btn"
                    disabled={!previews[img.id]}
                    onClick={() => setLightboxId(img.id)}
                    aria-label={`Preview ${img.caption || img.filename}`}
                  >
                    {previews[img.id] ? (
                      <img src={previews[img.id]} alt={img.caption || img.filename} />
                    ) : (
                      <span className="image-loading">Loading…</span>
                    )}
                  </button>
                  <div className="image-meta">
                    <strong>{img.kind || "image"}</strong>
                    <span>{img.caption || img.filename}</span>
                    <span className="image-size">{(img.size_bytes / 1024).toFixed(0)} KB</span>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => void handleDelete(img.id)}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
        </ul>
      )}

      {typeof document !== "undefined" &&
        lightboxId &&
        lightboxSrc &&
        createPortal(
          <div
            className="image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={() => setLightboxId(null)}
          >
            <div className="image-lightbox-inner" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="image-lightbox-close"
                aria-label="Close preview"
                onClick={() => setLightboxId(null)}
              >
                ×
              </button>
              <img
                src={lightboxSrc}
                alt={
                  isPendingMode
                    ? (lightboxImage as PendingImage | null)?.caption ||
                      (lightboxImage as PendingImage | null)?.file.name ||
                      "Preview"
                    : (lightboxImage as RecipeImage | null)?.caption ||
                      (lightboxImage as RecipeImage | null)?.filename ||
                      "Preview"
                }
              />
              {lightboxImage &&
                (("caption" in lightboxImage && lightboxImage.caption) ||
                  ("kind" in lightboxImage && lightboxImage.kind)) && (
                  <p className="image-lightbox-caption">
                    {lightboxImage.kind ? `${lightboxImage.kind}` : ""}
                    {lightboxImage.kind && lightboxImage.caption ? " · " : ""}
                    {lightboxImage.caption || ""}
                  </p>
                )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

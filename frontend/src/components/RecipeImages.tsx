"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteRecipeImage,
  fetchRecipeImageBlob,
  uploadRecipeImage,
} from "@/lib/api";
import type { Recipe, RecipeImage } from "@/lib/types";

const IMAGE_KINDS = [
  { value: "micrograph", label: "Micrograph" },
  { value: "overview", label: "Overview" },
  { value: "qc", label: "QC" },
  { value: "other", label: "Other" },
];

type Props = {
  recipeId: string;
  images: RecipeImage[];
  onChange: (recipe: Recipe) => void;
  readOnly?: boolean;
};

export default function RecipeImages({ recipeId, images, onChange, readOnly = false }: Props) {
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState("micrograph");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const objectUrls = useRef<string[]>([]);

  const imageKey = images.map((i) => i.id).join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadPreviews() {
      const next: Record<string, string> = {};
      for (const img of images) {
        try {
          const blob = await fetchRecipeImageBlob(recipeId, img.id);
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
  }, [recipeId, imageKey]);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
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
    try {
      const updated = await deleteRecipeImage(recipeId, imageId);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <section className="form-section recipe-images">
      <h2>Images</h2>
      {!readOnly && (
        <p className="images-hint">JPEG, PNG, or WebP — max 8 MB each.</p>
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
              accept="image/jpeg,image/png,image/webp"
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

      {images.length === 0 ? (
        <p className="images-empty">{readOnly ? "No images attached." : "No images yet."}</p>
      ) : (
        <ul className="image-grid">
          {images.map((img) => (
            <li key={img.id} className="image-card">
              <div className="image-thumb">
                {previews[img.id] ? (
                  <img src={previews[img.id]} alt={img.caption || img.filename} />
                ) : (
                  <span className="image-loading">Loading…</span>
                )}
              </div>
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
    </section>
  );
}

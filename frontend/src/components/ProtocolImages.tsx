"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import {
  deleteProtocolImage,
  fetchProtocolImageBlob,
  uploadProtocolImage,
} from "@/lib/api";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_LABEL,
  createPendingImage,
  validateImageFile,
  type PendingImage,
} from "@/lib/imageUpload";
import type { Protocol, ProtocolImage } from "@/lib/types";

const IMAGE_KINDS = [
  { value: "micrograph", label: "Micrograph" },
  { value: "overview", label: "Overview" },
  { value: "qc", label: "QC" },
  { value: "other", label: "Other" },
];

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

type Props = {
  protocolId?: string;
  images?: ProtocolImage[];
  onChange?: (protocol: Protocol) => void;
  pending?: PendingImage[];
  onPendingChange?: (pending: PendingImage[]) => void;
  readOnly?: boolean;
};

export default function ProtocolImages({
  protocolId,
  images = [],
  onChange,
  pending = [],
  onPendingChange,
  readOnly = false,
}: Props) {
  const isPendingMode = Boolean(onPendingChange) && !protocolId;
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState("micrograph");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  console.log("[ProtocolImages] render", {
    protocolId,
    readOnly,
    isPendingMode,
    uploading,
    imageCount: images.length,
    pendingCount: pending.length,
    hasOnChange: Boolean(onChange),
    hasOnPendingChange: Boolean(onPendingChange),
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);
  const dragDepth = useRef(0);

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
    if (isPendingMode || !protocolId) return;
    let cancelled = false;

    async function loadPreviews() {
      const next: Record<string, string> = {};
      for (const img of images) {
        try {
          const blob = await fetchProtocolImageBlob(protocolId!, img.id);
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
  }, [protocolId, imageKey, isPendingMode]);

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

  async function handleFiles(fileList: FileList | File[] | null) {
    const files = fileList ? Array.from(fileList) : [];
    console.log("[ProtocolImages] handleFiles", {
      count: files.length,
      uploading,
      files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    });
    if (!files.length || uploading) {
      console.log("[ProtocolImages] handleFiles early return", {
        empty: !files.length,
        uploading,
      });
      return;
    }
    setError(null);

    const valid: File[] = [];
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        console.warn("[ProtocolImages] validation failed", file.name, validationError);
        setError(validationError);
        return;
      }
      valid.push(file);
    }
    console.log("[ProtocolImages] validated", valid.length, "file(s)");

    const opts = {
      caption: caption.trim() || undefined,
      kind: kind || undefined,
    };

    if (isPendingMode && onPendingChange) {
      const next = valid.map((file) => createPendingImage(file, opts));
      console.log("[ProtocolImages] pending mode — adding local previews", next.length);
      onPendingChange([...pending, ...next]);
      setCaption("");
      return;
    }

    if (!protocolId || !onChange) {
      console.warn("[ProtocolImages] missing protocolId/onChange — abort upload", {
        protocolId,
        hasOnChange: Boolean(onChange),
        isPendingMode,
      });
      return;
    }

    setUploading(true);
    try {
      let updated: Protocol | null = null;
      for (const file of valid) {
        console.log("[ProtocolImages] uploading", file.name, "→", protocolId);
        updated = await uploadProtocolImage(protocolId, file, opts);
        console.log("[ProtocolImages] upload ok", {
          imageCount: updated.images?.length,
        });
      }
      setCaption("");
      if (updated) onChange(updated);
    } catch (err) {
      console.error("[ProtocolImages] upload error", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    console.log("[ProtocolImages] dragEnter", {
      depth: dragDepth.current,
      types: [...e.dataTransfer.types],
    });
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragActive(false);
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragActive(false);
    console.log("[ProtocolImages] drop", {
      fileCount: e.dataTransfer.files?.length ?? 0,
    });
    void handleFiles(e.dataTransfer.files);
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

    if (!protocolId || !onChange) return;

    try {
      if (lightboxId === imageId) setLightboxId(null);
      const updated = await deleteProtocolImage(protocolId, imageId);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const empty = isPendingMode ? pending.length === 0 : images.length === 0;

  return (
    <section className="form-section protocol-images">
      <h2>Images</h2>
      {!readOnly && (
        <p className="images-hint">
          JPEG, PNG, or WebP — max {MAX_IMAGE_LABEL} each
          {isPendingMode ? ". Uploaded when you save." : "."}
        </p>
      )}
      {error && <div className="alert">{error}</div>}

      {!readOnly && (
        <div className="images-upload">
          <div className="grid-2">
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
          </div>
          <label
            className={`image-dropzone${dragActive ? " is-dragging" : ""}${uploading ? " is-disabled" : ""}`}
            aria-label="Upload images by dragging or clicking to browse"
            onDragEnterCapture={onDragEnter}
            onDragLeaveCapture={onDragLeave}
            onDragOverCapture={onDragOver}
            onDropCapture={onDrop}
          >
            <input
              type="file"
              accept={ACCEPT}
              multiple
              disabled={uploading}
              className="image-dropzone-input"
              onClick={(e) => {
                console.log("[ProtocolImages] file input click", {
                  disabled: uploading,
                  accept: ACCEPT,
                });
                e.stopPropagation();
              }}
              onChange={(e) => {
                // FileList is live — copy before clearing value or it becomes empty
                const files = e.target.files ? Array.from(e.target.files) : [];
                console.log("[ProtocolImages] file input change", {
                  count: files.length,
                  names: files.map((f) => f.name),
                });
                e.target.value = "";
                void handleFiles(files);
              }}
            />
            <span className="image-dropzone-title">
              {uploading ? "Uploading…" : dragActive ? "Drop to upload" : "Drag images here"}
            </span>
            <span className="image-dropzone-sub">or click to browse</span>
          </label>
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
                    : (lightboxImage as ProtocolImage | null)?.caption ||
                      (lightboxImage as ProtocolImage | null)?.filename ||
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

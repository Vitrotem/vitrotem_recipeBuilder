"use client";

import { useEffect, useRef, useState } from "react";
import type { EntryType } from "@/lib/types";

type Props = {
  entryType: EntryType;
  onEdit: () => void;
  onConvert: () => void;
  onDelete: () => void;
};

export default function RecipeMenu({ entryType, onEdit, onConvert, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const convertLabel =
    entryType === "log" ? "Upgrade to recipe" : "Downgrade to log";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="recipe-menu" ref={rootRef}>
      <button
        type="button"
        className="recipe-menu-trigger"
        aria-label="Actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="recipe-menu-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onConvert();
            }}
          >
            {convertLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { fetchOrganizationIconBlob } from "@/lib/api";

type Props = {
  orgId: string;
  iconId?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export default function OrgIcon({ orgId, iconId, name, size = 20, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!iconId) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    void fetchOrganizationIconBlob(orgId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [orgId, iconId]);

  if (!src) {
    return (
      <span
        className={`org-icon org-icon-fallback${className ? ` ${className}` : ""}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className={`org-icon${className ? ` ${className}` : ""}`}
      src={src}
      alt=""
      width={size}
      height={size}
    />
  );
}

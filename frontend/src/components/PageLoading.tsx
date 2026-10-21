"use client";

import { useEffect, useState, type CSSProperties } from "react";

const WAKE_AFTER_MS = 2000;

/**
 * Shows `message`, then "Waking server…" if still active after 2s (cold backend).
 * Pass `active=false` to reset (e.g. idle submit button).
 */
export function useLoadingMessage(message = "Loading…", active = true): string {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    if (!active) {
      setWaking(false);
      return;
    }
    setWaking(false);
    const t = setTimeout(() => setWaking(true), WAKE_AFTER_MS);
    return () => clearTimeout(t);
  }, [message, active]);

  return active && waking ? "Waking server…" : message;
}

type PageLoadingProps = {
  message?: string;
  className?: string;
  style?: CSSProperties;
};

export default function PageLoading({
  message = "Loading…",
  className = "page-loading",
  style,
}: PageLoadingProps) {
  const text = useLoadingMessage(message);
  return (
    <div className={className} style={style}>
      {text}
    </div>
  );
}

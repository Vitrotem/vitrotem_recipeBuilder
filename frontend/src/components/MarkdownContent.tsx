"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { toEditorHtml } from "@/lib/richText";

type Props = {
  children: string;
  className?: string;
};

const PURIFY = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "hr",
    "span",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
};

function sanitizeNoteHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ...PURIFY,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/** Render stored note HTML (or legacy markdown) safely. */
export default function MarkdownContent({ children, className }: Props) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!children.trim()) {
      setHtml("");
      return;
    }
    setHtml(sanitizeNoteHtml(toEditorHtml(children)));
  }, [children]);

  if (!html) return null;

  return (
    <div
      className={className ? `markdown-body ${className}` : "markdown-body"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

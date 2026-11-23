"use client";

import { useId, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";

type Props = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "rows" | "placeholder">;

type WrapOpts = {
  before: string;
  after: string;
  placeholder?: string;
  /** When set, prefix each selected line (or current line) instead of wrapping. */
  linePrefix?: string;
};

function applyMarkup(
  textarea: HTMLTextAreaElement,
  value: string,
  opts: WrapOpts,
): { next: string; start: number; end: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  if (opts.linePrefix) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIdx = value.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const prefixed = lines
      .map((line) =>
        line.startsWith(opts.linePrefix!) ? line : `${opts.linePrefix}${line || opts.placeholder || ""}`,
      )
      .join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    return { next, start: lineStart, end: lineStart + prefixed.length };
  }

  const insert = selected || opts.placeholder || "";
  const wrapped = `${opts.before}${insert}${opts.after}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  const selStart = start + opts.before.length;
  const selEnd = selStart + insert.length;
  return { next, start: selStart, end: selEnd };
}

export default function MarkupField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  id,
  ...rest
}: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const ref = useRef<HTMLTextAreaElement>(null);

  function run(opts: WrapOpts) {
    const el = ref.current;
    if (!el) return;
    const { next, start, end } = applyMarkup(el, value, opts);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, end);
    });
  }

  return (
    <div className="markup-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="markup-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className="markup-btn"
          title="Bold"
          aria-label="Bold"
          onClick={() => run({ before: "**", after: "**", placeholder: "bold" })}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="markup-btn"
          title="Italic"
          aria-label="Italic"
          onClick={() => run({ before: "*", after: "*", placeholder: "italic" })}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="markup-btn"
          title="Heading"
          aria-label="Heading"
          onClick={() => run({ before: "", after: "", linePrefix: "## ", placeholder: "Heading" })}
        >
          H
        </button>
        <button
          type="button"
          className="markup-btn"
          title="Bullet list"
          aria-label="Bullet list"
          onClick={() => run({ before: "", after: "", linePrefix: "- ", placeholder: "item" })}
        >
          List
        </button>
        <button
          type="button"
          className="markup-btn"
          title="Numbered list"
          aria-label="Numbered list"
          onClick={() => run({ before: "", after: "", linePrefix: "1. ", placeholder: "item" })}
        >
          1.
        </button>
        <button
          type="button"
          className="markup-btn"
          title="Link"
          aria-label="Insert link"
          onClick={() => run({ before: "[", after: "](url)", placeholder: "link text" })}
        >
          Link
        </button>
      </div>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      <span className="markup-hint">Supports markdown: **bold**, *italic*, lists, links</span>
    </div>
  );
}

"use client";

import { useId, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import {
  MARKDOWN_COLORS,
  markdownColorClass,
  type MarkdownColorId,
} from "@/lib/markdownColors";

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
  /** Strip existing ATX heading markers before applying linePrefix. */
  asHeading?: boolean;
};

const HEADING_PREFIX_RE = /^#{1,6}\s+/;

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
      .map((line) => {
        const bare = opts.asHeading ? line.replace(HEADING_PREFIX_RE, "") : line;
        if (!opts.asHeading && bare.startsWith(opts.linePrefix!)) return bare;
        return `${opts.linePrefix}${bare || opts.placeholder || ""}`;
      })
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

/** Replace an existing color span around the selection, or wrap selection. */
function applyColor(
  textarea: HTMLTextAreaElement,
  value: string,
  colorId: MarkdownColorId | null,
): { next: string; start: number; end: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  let selStart = start;
  let selEnd = end;
  let inner = value.slice(start, end);

  const openRe = /<span class="md-color-[a-z]+">$/i;
  const closeRe = /^<\/span>/i;
  const before = value.slice(0, start);
  const after = value.slice(end);
  const openMatch = before.match(openRe);
  const closeMatch = after.match(closeRe);

  if (openMatch && closeMatch) {
    selStart = start - openMatch[0].length;
    selEnd = end + closeMatch[0].length;
    inner = value.slice(start, end);
  } else {
    const wrapped = value.slice(start, end).match(/^<span class="md-color-[a-z]+">([\s\S]*)<\/span>$/i);
    if (wrapped) {
      inner = wrapped[1];
    } else {
      inner = selectedOrPlaceholder(value, start, end, "colored text");
    }
  }

  if (!colorId) {
    const next = value.slice(0, selStart) + inner + value.slice(selEnd);
    return { next, start: selStart, end: selStart + inner.length };
  }

  const open = `<span class="${markdownColorClass(colorId)}">`;
  const close = "</span>";
  const wrapped = `${open}${inner}${close}`;
  const next = value.slice(0, selStart) + wrapped + value.slice(selEnd);
  return {
    next,
    start: selStart + open.length,
    end: selStart + open.length + inner.length,
  };
}

function selectedOrPlaceholder(value: string, start: number, end: number, fallback: string) {
  const selected = value.slice(start, end);
  return selected || fallback;
}

export default function MarkupField({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
  id,
  ...rest
}: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const previewId = `${fieldId}-preview`;
  const ref = useRef<HTMLTextAreaElement>(null);

  function commit(next: string, start: number, end: number) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  }

  function run(opts: WrapOpts) {
    const el = ref.current;
    if (!el) return;
    const { next, start, end } = applyMarkup(el, value, opts);
    commit(next, start, end);
  }

  function runColor(colorId: MarkdownColorId | null) {
    const el = ref.current;
    if (!el) return;
    const { next, start, end } = applyColor(el, value, colorId);
    commit(next, start, end);
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
        <span className="markup-toolbar-sep" aria-hidden />
        {([1, 2, 3, 4] as const).map((level) => (
          <button
            key={level}
            type="button"
            className="markup-btn"
            title={`Heading ${level}`}
            aria-label={`Heading ${level}`}
            onClick={() =>
              run({
                before: "",
                after: "",
                linePrefix: `${"#".repeat(level)} `,
                placeholder: `Heading ${level}`,
                asHeading: true,
              })
            }
          >
            H{level}
          </button>
        ))}
        <span className="markup-toolbar-sep" aria-hidden />
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
        <span className="markup-toolbar-sep" aria-hidden />
        <span className="markup-color-group" role="group" aria-label="Text color">
          {MARKDOWN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="markup-color-btn"
              title={c.label}
              aria-label={`${c.label} text`}
              style={{ background: c.swatch }}
              onClick={() => runColor(c.id)}
            />
          ))}
          <button
            type="button"
            className="markup-btn markup-btn-clear-color"
            title="Clear color"
            aria-label="Clear text color"
            onClick={() => runColor(null)}
          >
            A
          </button>
        </span>
      </div>

      <div className="markup-split">
        <textarea
          id={fieldId}
          ref={ref}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={previewId}
          {...rest}
        />
        <div
          id={previewId}
          className="markup-preview"
          aria-live="polite"
          aria-label="Live preview"
        >
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <p className="markup-preview-empty">Live preview</p>
          )}
        </div>
      </div>
      <span className="markup-hint">Markdown with live preview — headings, lists, links, and colors</span>
    </div>
  );
}

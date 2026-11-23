import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/** Convert stored notes (HTML or legacy markdown/plain text) into editor HTML. */
export function toEditorHtml(raw: string): string {
  const value = raw ?? "";
  if (!value.trim()) return "";
  // TipTap / HTML documents usually include block tags.
  if (/<\/?(?:p|h[1-6]|ul|ol|li|div|br|span)\b/i.test(value)) {
    return value;
  }
  return marked.parse(value, { async: false }) as string;
}

/** Empty TipTap docs serialize as <p></p> — treat as blank for storage. */
export function normalizeEditorHtml(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text ? html : "";
}

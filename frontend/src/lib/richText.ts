import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/** Turn <br>-joined lines inside paragraphs into separate <p> blocks. */
export function splitBreaksIntoParagraphs(html: string): string {
  return html.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (_match, attrs: string, inner: string) => {
    const parts = inner
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length <= 1) {
      return `<p${attrs}>${inner}</p>`;
    }
    return parts.map((part) => `<p${attrs}>${part}</p>`).join("");
  });
}

/** Convert stored notes (HTML or legacy markdown/plain text) into editor HTML. */
export function toEditorHtml(raw: string): string {
  const value = raw ?? "";
  if (!value.trim()) return "";
  // TipTap / HTML documents usually include block tags.
  if (/<\/?(?:p|h[1-6]|ul|ol|li|div|span)\b/i.test(value)) {
    return splitBreaksIntoParagraphs(value);
  }
  const parsed = marked.parse(value, { async: false }) as string;
  return splitBreaksIntoParagraphs(parsed);
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

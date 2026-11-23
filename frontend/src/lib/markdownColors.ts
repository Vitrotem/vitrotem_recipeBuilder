/** Note text colors for the rich-text toolbar. */
export const MARKDOWN_COLORS = [
  { id: "navy", label: "Navy", swatch: "#0a2540" },
  { id: "blue", label: "Blue", swatch: "#1e6fd9" },
  { id: "cyan", label: "Cyan", swatch: "#2a9bb8" },
  { id: "green", label: "Green", swatch: "#2f8f5b" },
  { id: "orange", label: "Orange", swatch: "#c47a1a" },
  { id: "red", label: "Red", swatch: "#c45c5c" },
  { id: "muted", label: "Muted", swatch: "#5a7a96" },
] as const;

export type MarkdownColorId = (typeof MARKDOWN_COLORS)[number]["id"];

/** Legacy class-based color spans from the earlier markdown editor. */
export const MARKDOWN_COLOR_CLASS_RE = /^md-color-(navy|blue|cyan|green|orange|red|muted)$/;

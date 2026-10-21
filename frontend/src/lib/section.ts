import type { BrowseSection } from "./types";

const SECTION_KEY = "vitrotem_entry_section";

const VALID: BrowseSection[] = [
  "recipe",
  "log",
  "personal-recipe",
  "personal-log",
  "organization-recipe",
  "organization-log",
];

/** Map legacy sidebar keys saved before personal/org recipes+logs split. */
function migrateLegacy(value: string | null): BrowseSection {
  if (value === "personal") return "personal-recipe";
  if (value === "organization") return "organization-recipe";
  if (VALID.includes(value as BrowseSection)) return value as BrowseSection;
  return "recipe";
}

export function getEntrySection(): BrowseSection {
  if (typeof window === "undefined") return "recipe";
  return migrateLegacy(localStorage.getItem(SECTION_KEY));
}

export function setEntrySection(section: BrowseSection): void {
  localStorage.setItem(SECTION_KEY, section);
}

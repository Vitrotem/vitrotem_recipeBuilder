import type { BrowseSection } from "./types";

const SECTION_KEY = "vitrotem_entry_section";

const VALID: BrowseSection[] = ["recipe", "log", "personal", "organization"];

export function getEntrySection(): BrowseSection {
  if (typeof window === "undefined") return "recipe";
  const value = localStorage.getItem(SECTION_KEY);
  return VALID.includes(value as BrowseSection) ? (value as BrowseSection) : "recipe";
}

export function setEntrySection(section: BrowseSection): void {
  localStorage.setItem(SECTION_KEY, section);
}

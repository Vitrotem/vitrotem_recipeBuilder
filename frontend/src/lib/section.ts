import type { EntryType } from "./types";

const SECTION_KEY = "vitrotem_entry_section";

export function getEntrySection(): EntryType {
  if (typeof window === "undefined") return "recipe";
  const value = localStorage.getItem(SECTION_KEY);
  return value === "log" ? "log" : "recipe";
}

export function setEntrySection(section: EntryType): void {
  localStorage.setItem(SECTION_KEY, section);
}

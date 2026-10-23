import type { BrowseSection } from "./types";

const SECTION_KEY = "vitrotem_entry_section";
const ORG_KEY = "vitrotem_browse_org";

const VALID: BrowseSection[] = [
  "protocol",
  "log",
  "personal-protocol",
  "personal-log",
  "organization-protocol",
  "organization-log",
];

/** Map legacy sidebar keys saved before personal/org protocols+logs split / Recipe→Protocol rename. */
function migrateLegacy(value: string | null): BrowseSection {
  if (value === "personal" || value === "personal-recipe") return "personal-protocol";
  if (value === "organization" || value === "organization-recipe") return "organization-protocol";
  if (value === "recipe") return "protocol";
  if (VALID.includes(value as BrowseSection)) return value as BrowseSection;
  return "protocol";
}

export function getEntrySection(): BrowseSection {
  if (typeof window === "undefined") return "protocol";
  return migrateLegacy(localStorage.getItem(SECTION_KEY));
}

export function setEntrySection(section: BrowseSection): void {
  localStorage.setItem(SECTION_KEY, section);
}

export function getBrowseOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_KEY);
}

export function setBrowseOrganizationId(orgId: string | null): void {
  if (orgId) localStorage.setItem(ORG_KEY, orgId);
  else localStorage.removeItem(ORG_KEY);
}

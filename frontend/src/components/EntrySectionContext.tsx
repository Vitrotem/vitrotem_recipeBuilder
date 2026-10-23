"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getBrowseOrganizationId,
  getEntrySection,
  setBrowseOrganizationId as persistOrgId,
  setEntrySection as persistSection,
} from "@/lib/section";
import {
  browseSectionEntryType,
  browseSectionScope,
  type BrowseSection,
  type EntryType,
} from "@/lib/types";

type EntrySectionContextValue = {
  section: BrowseSection;
  organizationId: string | null;
  setSection: (section: BrowseSection, organizationId?: string | null) => void;
  newEntryType: EntryType;
};

const EntrySectionContext = createContext<EntrySectionContextValue | null>(null);

export function EntrySectionProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<BrowseSection>("protocol");
  const [organizationId, setOrganizationIdState] = useState<string | null>(null);

  useEffect(() => {
    setSectionState(getEntrySection());
    setOrganizationIdState(getBrowseOrganizationId());
  }, []);

  const setSection = useCallback((next: BrowseSection, orgId?: string | null) => {
    setSectionState(next);
    persistSection(next);
    const scope = browseSectionScope(next);
    const resolved = scope === "organization" ? (orgId ?? getBrowseOrganizationId()) : null;
    setOrganizationIdState(resolved);
    persistOrgId(resolved);
  }, []);

  const newEntryType = browseSectionEntryType(section);

  const value = useMemo(
    () => ({ section, organizationId, setSection, newEntryType }),
    [section, organizationId, setSection, newEntryType],
  );

  return (
    <EntrySectionContext.Provider value={value}>{children}</EntrySectionContext.Provider>
  );
}

export function useEntrySection(): EntrySectionContextValue {
  const ctx = useContext(EntrySectionContext);
  if (!ctx) {
    throw new Error("useEntrySection must be used within EntrySectionProvider");
  }
  return ctx;
}

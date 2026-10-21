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
import { getEntrySection, setEntrySection as persistSection } from "@/lib/section";
import type { BrowseSection, EntryType } from "@/lib/types";

type EntrySectionContextValue = {
  section: BrowseSection;
  setSection: (section: BrowseSection) => void;
  /** Entry type for "New …" when browsing personal/org (defaults to recipe). */
  newEntryType: EntryType;
};

const EntrySectionContext = createContext<EntrySectionContextValue | null>(null);

export function EntrySectionProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<BrowseSection>("recipe");

  useEffect(() => {
    setSectionState(getEntrySection());
  }, []);

  const setSection = useCallback((next: BrowseSection) => {
    setSectionState(next);
    persistSection(next);
  }, []);

  const newEntryType: EntryType =
    section === "log" ? "log" : section === "recipe" ? "recipe" : "recipe";

  const value = useMemo(
    () => ({ section, setSection, newEntryType }),
    [section, setSection, newEntryType],
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

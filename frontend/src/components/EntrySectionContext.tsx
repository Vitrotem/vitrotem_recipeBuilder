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
import type { EntryType } from "@/lib/types";

type EntrySectionContextValue = {
  section: EntryType;
  setSection: (section: EntryType) => void;
};

const EntrySectionContext = createContext<EntrySectionContextValue | null>(null);

export function EntrySectionProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<EntryType>("recipe");

  useEffect(() => {
    setSectionState(getEntrySection());
  }, []);

  const setSection = useCallback((next: EntryType) => {
    setSectionState(next);
    persistSection(next);
  }, []);

  const value = useMemo(() => ({ section, setSection }), [section, setSection]);

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

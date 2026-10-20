"use client";

import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { EntrySectionProvider, useEntrySection } from "@/components/EntrySectionContext";
import type { EntryType } from "@/lib/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <EntrySectionProvider>
      <AppHeader />
      <div className="app-body">
        <SectionNav />
        <div className="app-content">{children}</div>
      </div>
    </EntrySectionProvider>
  );
}

function SectionNav() {
  const { section, setSection } = useEntrySection();
  const router = useRouter();
  const pathname = usePathname();

  function select(next: EntryType) {
    setSection(next);
    if (pathname !== "/") {
      router.push("/");
    }
  }

  return (
    <aside className="section-nav" aria-label="Entry sections">
      <p className="section-nav-label">Browse</p>
      <nav className="section-nav-list">
        <button
          type="button"
          className={`section-nav-item${section === "recipe" ? " active" : ""}`}
          aria-current={section === "recipe" ? "page" : undefined}
          onClick={() => select("recipe")}
        >
          Recipes
        </button>
        <button
          type="button"
          className={`section-nav-item${section === "log" ? " active" : ""}`}
          aria-current={section === "log" ? "page" : undefined}
          onClick={() => select("log")}
        >
          Logs
        </button>
      </nav>
    </aside>
  );
}

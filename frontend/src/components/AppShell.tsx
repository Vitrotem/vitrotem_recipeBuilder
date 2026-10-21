"use client";

import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { EntrySectionProvider, useEntrySection } from "@/components/EntrySectionContext";
import { UserProvider, useUser } from "@/components/UserContext";
import type { BrowseSection } from "@/lib/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <EntrySectionProvider>
        <AppHeader />
        <div className="app-body">
          <SectionNav />
          <div className="app-content">{children}</div>
        </div>
      </EntrySectionProvider>
    </UserProvider>
  );
}

function SectionNav() {
  const { section, setSection } = useEntrySection();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasOrgs = (user?.organizations.length ?? 0) > 0;

  function select(next: BrowseSection) {
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

      <p className="section-nav-label section-nav-label-spaced">Private</p>
      <nav className="section-nav-list">
        <button
          type="button"
          className={`section-nav-item${section === "personal" ? " active" : ""}`}
          aria-current={section === "personal" ? "page" : undefined}
          onClick={() => select("personal")}
        >
          Personal
        </button>
        {hasOrgs && (
          <button
            type="button"
            className={`section-nav-item${section === "organization" ? " active" : ""}`}
            aria-current={section === "organization" ? "page" : undefined}
            onClick={() => select("organization")}
          >
            Organization
          </button>
        )}
      </nav>
    </aside>
  );
}

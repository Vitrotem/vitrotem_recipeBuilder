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

function NavItem({
  id,
  label,
  section,
  onSelect,
}: {
  id: BrowseSection;
  label: string;
  section: BrowseSection;
  onSelect: (next: BrowseSection) => void;
}) {
  const active = section === id;
  return (
    <button
      type="button"
      className={`section-nav-item${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
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
        <NavItem id="recipe" label="Recipes" section={section} onSelect={select} />
        <NavItem id="log" label="Logs" section={section} onSelect={select} />
      </nav>

      <p className="section-nav-label section-nav-label-spaced">Private</p>
      <nav className="section-nav-list">
        <NavItem
          id="personal-recipe"
          label="Recipes"
          section={section}
          onSelect={select}
        />
        <NavItem id="personal-log" label="Logs" section={section} onSelect={select} />
      </nav>

      {hasOrgs && (
        <>
          <p className="section-nav-label section-nav-label-spaced">Organization</p>
          <nav className="section-nav-list">
            <NavItem
              id="organization-recipe"
              label="Recipes"
              section={section}
              onSelect={select}
            />
            <NavItem
              id="organization-log"
              label="Logs"
              section={section}
              onSelect={select}
            />
          </nav>
        </>
      )}
    </aside>
  );
}

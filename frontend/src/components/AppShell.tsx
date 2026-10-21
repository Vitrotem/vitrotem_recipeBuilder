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
  active,
  onSelect,
}: {
  id: BrowseSection;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`section-nav-item${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

function SectionNav() {
  const { section, organizationId, setSection } = useEntrySection();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const orgs = user?.organizations ?? [];

  function select(next: BrowseSection, orgId?: string | null) {
    setSection(next, orgId);
    if (pathname !== "/") {
      router.push("/");
    }
  }

  return (
    <aside className="section-nav" aria-label="Entry sections">
      <p className="section-nav-label">Browse</p>
      <nav className="section-nav-list">
        <NavItem
          id="recipe"
          label="Recipes"
          active={section === "recipe"}
          onSelect={() => select("recipe")}
        />
        <NavItem
          id="log"
          label="Logs"
          active={section === "log"}
          onSelect={() => select("log")}
        />
      </nav>

      <p className="section-nav-label section-nav-label-spaced">Private</p>
      <nav className="section-nav-list">
        <NavItem
          id="personal-recipe"
          label="Recipes"
          active={section === "personal-recipe"}
          onSelect={() => select("personal-recipe")}
        />
        <NavItem
          id="personal-log"
          label="Logs"
          active={section === "personal-log"}
          onSelect={() => select("personal-log")}
        />
      </nav>

      {orgs.map((org) => (
        <div key={org.id}>
          <p className="section-nav-label section-nav-label-spaced" title={org.name}>
            {org.name}
          </p>
          <nav className="section-nav-list">
            <NavItem
              id="organization-recipe"
              label="Recipes"
              active={section === "organization-recipe" && organizationId === org.id}
              onSelect={() => select("organization-recipe", org.id)}
            />
            <NavItem
              id="organization-log"
              label="Logs"
              active={section === "organization-log" && organizationId === org.id}
              onSelect={() => select("organization-log", org.id)}
            />
          </nav>
        </div>
      ))}
    </aside>
  );
}

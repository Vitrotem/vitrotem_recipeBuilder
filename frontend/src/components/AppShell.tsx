"use client";

import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { EntrySectionProvider, useEntrySection } from "@/components/EntrySectionContext";
import OrgIcon from "@/components/OrgIcon";
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
      <div className="section-nav-group">
        <p className="section-nav-label">Public</p>
        <nav className="section-nav-list">
          <NavItem
            id="protocol"
            label="Protocols"
            active={section === "protocol"}
            onSelect={() => select("protocol")}
          />
          <NavItem
            id="log"
            label="Logs"
            active={section === "log"}
            onSelect={() => select("log")}
          />
        </nav>
      </div>

      {orgs.map((org) => (
        <div key={org.id} className="section-nav-group">
          <p className="section-nav-label" title={org.name}>
            <OrgIcon orgId={org.id} iconId={org.icon_id} name={org.name} />
            <span>{org.name}</span>
          </p>
          <nav className="section-nav-list">
            <NavItem
              id="organization-protocol"
              label="Protocols"
              active={section === "organization-protocol" && organizationId === org.id}
              onSelect={() => select("organization-protocol", org.id)}
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

      <div className="section-nav-group">
        <p className="section-nav-label">Private</p>
        <nav className="section-nav-list">
          <NavItem
            id="personal-protocol"
            label="Protocols"
            active={section === "personal-protocol"}
            onSelect={() => select("personal-protocol")}
          />
          <NavItem
            id="personal-log"
            label="Logs"
            active={section === "personal-log"}
            onSelect={() => select("personal-log")}
          />
        </nav>
      </div>
    </aside>
  );
}

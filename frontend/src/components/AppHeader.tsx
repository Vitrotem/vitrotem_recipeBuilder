"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEntrySection } from "@/components/EntrySectionContext";
import { useUser } from "@/components/UserContext";
import { clearToken } from "@/lib/auth";
import { browseSectionScope } from "@/lib/types";

export default function AppHeader() {
  const router = useRouter();
  const { section, organizationId, newEntryType } = useEntrySection();
  const { user } = useUser();
  const newLabel = newEntryType === "log" ? "New log" : "New protocol";
  const scope = browseSectionScope(section);

  function newHref(): string {
    const params = new URLSearchParams({ entry_type: newEntryType });
    if (scope === "personal") {
      params.set("visibility", "private");
    } else if (scope === "organization") {
      const orgId = organizationId || user?.organizations[0]?.id;
      if (orgId) {
        params.set("visibility", "organization");
        params.set("organization_id", orgId);
      }
    }
    return `/protocols/new?${params.toString()}`;
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4L12 2.5zm0 2.3L6 8.1v7.8l6 3.5 6-3.5V8.1L12 4.8z" />
            </svg>
          </span>
          <span className="brand-text">
            <strong>vitroTEM</strong>
            <em>Protocol Builder</em>
          </span>
        </Link>
        <nav className="header-actions">
          <Link href="/account" className="btn btn-ghost">
            {user?.username ?? "Account"}
          </Link>
          <Link href={newHref()} className="btn btn-primary">
            {newLabel}
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}

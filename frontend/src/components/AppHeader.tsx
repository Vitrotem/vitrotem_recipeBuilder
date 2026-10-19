"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function AppHeader() {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">VT</span>
          <span className="brand-text">
            <strong>VitroTEM</strong>
            <em>Recipe Builder</em>
          </span>
        </Link>
        <nav className="header-actions">
          <Link href="/recipes/new" className="btn btn-primary">
            New recipe
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}

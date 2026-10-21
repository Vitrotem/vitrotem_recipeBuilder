"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import { listRecipes } from "@/lib/api";
import {
  browseSectionLabel,
  entryTypeLabel,
  type BrowseSection,
  type EntryType,
  type Recipe,
} from "@/lib/types";

function scopeForSection(section: BrowseSection): "personal" | "organization" | "global" {
  if (section === "personal") return "personal";
  if (section === "organization") return "organization";
  return "global";
}

function entryTypeForSection(section: BrowseSection): EntryType | undefined {
  if (section === "recipe" || section === "log") return section;
  return undefined;
}

export default function HomePage() {
  return (
    <AuthGuard>
      <AppShell>
        <RecipeList />
      </AppShell>
    </AuthGuard>
  );
}

function RecipeList() {
  const { section } = useEntrySection();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isPrivateScope = section === "personal" || section === "organization";
  const title = browseSectionLabel(section);
  const nounPlural = isPrivateScope
    ? "entries"
    : entryTypeLabel(section as EntryType, true).toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes({
        q: q || undefined,
        modality: modality || undefined,
        entry_type: entryTypeForSection(section),
        scope: scopeForSection(section),
      });
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${nounPlural}`);
    } finally {
      setLoading(false);
    }
  }, [q, modality, section, nounPlural]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const subtitle =
    section === "personal"
      ? "Entries only you can see"
      : section === "organization"
        ? "Shared with your organization members"
        : section === "log"
          ? "Public experimental notes and runs — upgrade any log to a recipe when it is ready"
          : "Public graphene liquid cell protocols for cryo-EM and room-temperature EM";

  return (
    <main className="page">
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{subtitle}</p>

      <div className="filters">
        <input
          placeholder="Search name, author, tags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={modality} onChange={(e) => setModality(e.target.value)}>
          <option value="">All modalities</option>
          <option value="cryo">Cryo-EM</option>
          <option value="rt">Room Temperature TEM</option>
        </select>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading {nounPlural}…</div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          No {nounPlural} yet.{" "}
          <Link
            href={`/recipes/new?entry_type=${section === "log" ? "log" : "recipe"}${
              section === "personal"
                ? "&visibility=private"
                : section === "organization"
                  ? "&visibility=organization"
                  : ""
            }`}
          >
            Create one
          </Link>
          .
        </div>
      ) : (
        <ul className="recipe-list">
          {recipes.map((r) => (
            <li key={r.id}>
              <Link href={`/recipes/${r.id}`} className="recipe-row">
                <h3>{r.name}</h3>
                <div className="recipe-meta">
                  <span className={`badge ${r.modality === "rt" ? "badge-rt" : ""}`}>
                    {r.modality === "cryo" ? "Cryo" : "RT"}
                  </span>
                  {isPrivateScope && (
                    <span className="badge badge-muted">
                      {r.entry_type === "log" ? "Log" : "Recipe"}
                    </span>
                  )}
                  {r.author && <span>{r.author}</span>}
                  {r.sample?.subtype && <span>{r.sample.subtype}</span>}
                  {r.outcome?.status && <span>Outcome: {r.outcome.status}</span>}
                  <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

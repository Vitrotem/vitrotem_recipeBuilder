"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import { listRecipes } from "@/lib/api";
import { entryTypeLabel, type Recipe } from "@/lib/types";

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

  const noun = entryTypeLabel(section);
  const nounPlural = entryTypeLabel(section, true).toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes({
        q: q || undefined,
        modality: modality || undefined,
        entry_type: section,
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

  return (
    <main className="page">
      <h1 className="page-title">{entryTypeLabel(section, true)}</h1>
      <p className="page-sub">
        {section === "log"
          ? "Experimental notes and runs — upgrade any log to a recipe when it is ready"
          : "Graphene liquid cell protocols for cryo-EM and room-temperature EM"}
      </p>

      <div className="filters">
        <input
          placeholder="Search name, author, sample…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={modality} onChange={(e) => setModality(e.target.value)}>
          <option value="">All modalities</option>
          <option value="cryo">Cryo-EM</option>
          <option value="rt">Room temperature</option>
        </select>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading {nounPlural}…</div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          No {nounPlural} yet.{" "}
          <Link href={`/recipes/new?entry_type=${section}`}>
            Create the first {noun.toLowerCase()}
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

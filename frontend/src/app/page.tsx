"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import { listRecipes } from "@/lib/api";
import type { Recipe } from "@/lib/types";

export default function HomePage() {
  return (
    <AuthGuard>
      <AppHeader />
      <RecipeList />
    </AuthGuard>
  );
}

function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes({
        q: q || undefined,
        modality: modality || undefined,
      });
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, [q, modality]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <main className="page">
      <h1 className="page-title">Recipes</h1>
      <p className="page-sub">Graphene liquid cell protocols for cryo-EM and room-temperature EM</p>

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
        <p className="page-loading">Loading recipes…</p>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          No recipes yet. <Link href="/recipes/new">Create the first one</Link>.
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

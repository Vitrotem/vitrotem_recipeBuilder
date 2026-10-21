"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import PageLoading from "@/components/PageLoading";
import { useUser } from "@/components/UserContext";
import { listRecipes } from "@/lib/api";
import {
  browseSectionEntryType,
  browseSectionLabel,
  browseSectionScope,
  entryTypeLabel,
  type Recipe,
} from "@/lib/types";

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
  const { section, organizationId } = useEntrySection();
  const { user } = useUser();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const scope = browseSectionScope(section);
  const entryType = browseSectionEntryType(section);
  const orgName =
    scope === "organization"
      ? user?.organizations.find((o) => o.id === organizationId)?.name
      : null;
  const title = browseSectionLabel(section, orgName);
  const nounPlural = entryTypeLabel(entryType, true).toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes({
        q: q || undefined,
        modality: modality || undefined,
        entry_type: entryType,
        scope,
        organization_id: scope === "organization" ? organizationId || undefined : undefined,
      });
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${nounPlural}`);
    } finally {
      setLoading(false);
    }
  }, [q, modality, entryType, scope, organizationId, nounPlural]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const subtitle =
    scope === "personal"
      ? `Private ${nounPlural} only you can see`
      : scope === "organization"
        ? `${orgName ?? "Organization"} ${nounPlural} shared with members`
        : entryType === "log"
          ? "Public experimental notes and runs — upgrade any log to a recipe when it is ready"
          : "Public graphene liquid cell protocols for cryo-EM and room-temperature EM";

  const newHref = (() => {
    const params = new URLSearchParams({ entry_type: entryType });
    if (scope === "personal") params.set("visibility", "private");
    if (scope === "organization") {
      params.set("visibility", "organization");
      if (organizationId) params.set("organization_id", organizationId);
    }
    return `/recipes/new?${params.toString()}`;
  })();

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
        <PageLoading message={`Loading ${nounPlural}…`} />
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          No {nounPlural} yet. <Link href={newHref}>Create one</Link>.
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

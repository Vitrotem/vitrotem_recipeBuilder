"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import PageLoading from "@/components/PageLoading";
import RecipeForm from "@/components/RecipeForm";
import RecipeImages from "@/components/RecipeImages";
import RecipeMenu from "@/components/RecipeMenu";
import RecipeView from "@/components/RecipeView";
import { deleteRecipe, getRecipe, setEntryType, updateRecipe } from "@/lib/api";
import {
  browseSectionFromVisibility,
  entryTypeLabel,
  type EntryType,
  type Recipe,
  type RecipeImage,
  type RecipeInput,
} from "@/lib/types";

const EMPTY_IMAGES: RecipeImage[] = [];

export default function RecipeDetailPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageLoading />}>
          <RecipeDetailInner />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}

function RecipeDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const router = useRouter();
  const { setSection } = useEntrySection();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(
    searchParams.get("edit") === "1" ? "edit" : "view",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getRecipe(id)
      .then(setRecipe)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  useEffect(() => {
    if (!recipe) return;
    const next = browseSectionFromVisibility(recipe.visibility, recipe.entry_type ?? "recipe");
    setSection(next, recipe.organization_id ?? null);
  }, [recipe, setSection]);

  useEffect(() => {
    if (!recipe || searchParams.get("saved") !== "1") return;
    setToast(`${entryTypeLabel(recipe.entry_type ?? "recipe")} saved`);
    router.replace(`/recipes/${id}`);
  }, [searchParams, id, router, recipe]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(data: RecipeInput) {
    const updated = await updateRecipe(id, {
      ...data,
      entry_type: recipe?.entry_type ?? data.entry_type ?? "recipe",
    });
    setRecipe(updated);
    // Stay in edit so the save confirmation next to the button is visible
    router.replace(`/recipes/${id}`);
  }

  async function handleConvert() {
    if (!recipe) return;
    const next: EntryType = recipe.entry_type === "log" ? "recipe" : "log";
    const label =
      next === "recipe" ? "Upgrade to recipe?" : "Downgrade to log?";
    if (!confirm(label)) return;
    const updated = await setEntryType(id, next);
    setRecipe(updated);
    setSection(
      browseSectionFromVisibility(updated.visibility, next),
      updated.organization_id ?? null,
    );
    setToast(
      next === "recipe" ? "Upgraded to recipe" : "Downgraded to log",
    );
  }

  async function handleDelete() {
    const kind = recipe?.entry_type ?? "recipe";
    if (!confirm(`Delete this ${entryTypeLabel(kind).toLowerCase()}? This cannot be undone.`)) {
      return;
    }
    await deleteRecipe(id);
    router.push("/");
  }

  if (error) {
    return (
      <main className="page">
        <div className="alert">{error}</div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="page">
        <PageLoading />
      </main>
    );
  }

  const kind = recipe.entry_type ?? "recipe";
  const noun = entryTypeLabel(kind).toLowerCase();

  const initial: RecipeInput = {
    name: recipe.name,
    entry_type: kind,
    modality: recipe.modality,
    author: recipe.author,
    tags: recipe.tags,
    notes: recipe.notes,
    plasma: recipe.plasma || {},
    naiad: recipe.naiad || {},
    sample: recipe.sample || {},
    grid: recipe.grid || {},
    graphene: recipe.graphene || {},
    microscope: recipe.microscope || {},
    outcome: recipe.outcome || {},
    visibility: recipe.visibility ?? "global",
    organization_id: recipe.organization_id ?? null,
  };

  return (
    <main className="page">
      <div className="recipe-page-header">
        <div>
          <h1 className="page-title">{recipe.name}</h1>
          <p className="page-sub">
            {mode === "edit"
              ? `Edit ${noun} parameters and outcome`
              : `${entryTypeLabel(kind)} details`}
          </p>
        </div>
        <div className="recipe-page-actions">
          {toast && <span className="toast success toast-inline">{toast}</span>}
          {mode === "edit" && (
            <button type="button" className="btn btn-ghost" onClick={() => setMode("view")}>
              Cancel
            </button>
          )}
          <RecipeMenu
            entryType={kind}
            onEdit={() => setMode("edit")}
            onConvert={() => void handleConvert()}
            onDelete={() => void handleDelete()}
          />
        </div>
      </div>

      {mode === "view" ? (
        <RecipeView recipe={recipe} />
      ) : (
        <RecipeForm
          key={`${recipe.id}-edit`}
          initial={initial}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}

      <RecipeImages
        recipeId={recipe.id}
        images={recipe.images ?? EMPTY_IMAGES}
        onChange={setRecipe}
        readOnly={mode === "view"}
      />
    </main>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import RecipeForm from "@/components/RecipeForm";
import RecipeImages from "@/components/RecipeImages";
import RecipeMenu from "@/components/RecipeMenu";
import RecipeView from "@/components/RecipeView";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/api";
import type { Recipe, RecipeImage, RecipeInput } from "@/lib/types";

const EMPTY_IMAGES: RecipeImage[] = [];

export default function RecipeDetailPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <Suspense fallback={<div className="page-loading">Loading recipe…</div>}>
        <RecipeDetailInner />
      </Suspense>
    </AuthGuard>
  );
}

function RecipeDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const router = useRouter();
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
    if (searchParams.get("saved") === "1") {
      setToast("Recipe saved");
      router.replace(`/recipes/${id}`);
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(data: RecipeInput) {
    const updated = await updateRecipe(id, data);
    setRecipe(updated);
    setMode("view");
    setToast("Recipe saved");
    router.replace(`/recipes/${id}`);
  }

  async function handleDelete() {
    if (!confirm("Delete this recipe? This cannot be undone.")) return;
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
        <div className="page-loading">Loading recipe…</div>
      </main>
    );
  }

  const initial: RecipeInput = {
    name: recipe.name,
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
  };

  return (
    <main className="page">
      {toast && <div className="toast success">{toast}</div>}

      <div className="recipe-page-header">
        <div>
          <h1 className="page-title">{recipe.name}</h1>
          <p className="page-sub">
            {mode === "edit" ? "Edit recipe parameters and outcome" : "Recipe details"}
          </p>
        </div>
        <div className="recipe-page-actions">
          {mode === "edit" && (
            <button type="button" className="btn btn-ghost" onClick={() => setMode("view")}>
              Cancel
            </button>
          )}
          <RecipeMenu onEdit={() => setMode("edit")} onDelete={() => void handleDelete()} />
        </div>
      </div>

      <RecipeImages
        recipeId={recipe.id}
        images={recipe.images ?? EMPTY_IMAGES}
        onChange={setRecipe}
        readOnly={mode === "view"}
      />

      {mode === "view" ? (
        <RecipeView recipe={recipe} />
      ) : (
        <RecipeForm
          key={`${recipe.id}-${recipe.updated_at}-edit`}
          initial={initial}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

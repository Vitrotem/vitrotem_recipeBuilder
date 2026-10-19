"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import RecipeForm from "@/components/RecipeForm";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/api";
import type { Recipe, RecipeInput } from "@/lib/types";

export default function EditRecipePage() {
  return (
    <AuthGuard>
      <AppHeader />
      <EditInner />
    </AuthGuard>
  );
}

function EditInner() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecipe(id)
      .then(setRecipe)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  async function handleSubmit(data: RecipeInput) {
    const updated = await updateRecipe(id, data);
    setRecipe(updated);
  }

  async function handleDelete() {
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
    return <div className="page-loading">Loading recipe…</div>;
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
      <h1 className="page-title">{recipe.name}</h1>
      <p className="page-sub">Edit recipe parameters and outcome</p>
      <RecipeForm
        initial={initial}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </main>
  );
}

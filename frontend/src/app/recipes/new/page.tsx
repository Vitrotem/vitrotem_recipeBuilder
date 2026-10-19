"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import RecipeForm from "@/components/RecipeForm";
import { createRecipe } from "@/lib/api";
import { emptyRecipe, type RecipeInput } from "@/lib/types";

export default function NewRecipePage() {
  const router = useRouter();

  async function handleSubmit(data: RecipeInput) {
    const created = await createRecipe(data);
    router.push(`/recipes/${created.id}?saved=1`);
  }

  return (
    <AuthGuard>
      <AppHeader />
      <main className="page">
        <h1 className="page-title">New recipe</h1>
        <p className="page-sub">Capture plasma, NAIAD, sample, grid, graphene, and microscope settings</p>
        <RecipeForm initial={emptyRecipe()} submitLabel="Create recipe" onSubmit={handleSubmit} />
      </main>
    </AuthGuard>
  );
}

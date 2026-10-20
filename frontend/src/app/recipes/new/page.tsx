"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import RecipeForm from "@/components/RecipeForm";
import { createRecipe } from "@/lib/api";
import { emptyRecipe, entryTypeLabel, type EntryType, type RecipeInput } from "@/lib/types";

export default function NewRecipePage() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<div className="page-loading">Loading…</div>}>
          <NewRecipeInner />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}

function NewRecipeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { section, setSection } = useEntrySection();
  const paramType = searchParams.get("entry_type");
  const entryType: EntryType =
    paramType === "log" || paramType === "recipe" ? paramType : section;
  const noun = entryTypeLabel(entryType).toLowerCase();

  useEffect(() => {
    if (entryType !== section) setSection(entryType);
  }, [entryType, section, setSection]);

  async function handleSubmit(data: RecipeInput) {
    const created = await createRecipe({ ...data, entry_type: entryType });
    router.push(`/recipes/${created.id}?saved=1`);
  }

  return (
    <main className="page">
      <h1 className="page-title">New {noun}</h1>
      <p className="page-sub">
        Capture plasma, NAIAD, sample, grid, graphene, and microscope settings
      </p>
      <RecipeForm
        key={entryType}
        initial={emptyRecipe(entryType)}
        submitLabel={`Create ${noun}`}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

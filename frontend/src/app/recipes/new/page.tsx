"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import RecipeForm from "@/components/RecipeForm";
import RecipeImages from "@/components/RecipeImages";
import { createRecipe, uploadRecipeImage } from "@/lib/api";
import { revokePendingImages, type PendingImage } from "@/lib/imageUpload";
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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingRef = useRef(pendingImages);
  pendingRef.current = pendingImages;

  useEffect(() => {
    if (entryType !== section) setSection(entryType);
  }, [entryType, section, setSection]);

  useEffect(() => {
    return () => revokePendingImages(pendingRef.current);
  }, []);

  async function handleSubmit(data: RecipeInput) {
    const toUpload = pendingRef.current;
    const created = await createRecipe({ ...data, entry_type: entryType });
    try {
      for (const img of toUpload) {
        await uploadRecipeImage(created.id, img.file, {
          caption: img.caption || undefined,
          kind: img.kind || undefined,
        });
      }
    } finally {
      revokePendingImages(toUpload);
      setPendingImages([]);
    }
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
      >
        <RecipeImages pending={pendingImages} onPendingChange={setPendingImages} />
      </RecipeForm>
    </main>
  );
}

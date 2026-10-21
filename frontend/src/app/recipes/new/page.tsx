"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { useEntrySection } from "@/components/EntrySectionContext";
import { useUser } from "@/components/UserContext";
import RecipeForm from "@/components/RecipeForm";
import RecipeImages from "@/components/RecipeImages";
import { createRecipe, uploadRecipeImage } from "@/lib/api";
import { revokePendingImages, type PendingImage } from "@/lib/imageUpload";
import {
  browseSectionFromVisibility,
  emptyRecipe,
  entryTypeLabel,
  type EntryType,
  type RecipeInput,
  type Visibility,
} from "@/lib/types";

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
  const { user, loading: userLoading } = useUser();
  const paramType = searchParams.get("entry_type");
  const entryType: EntryType =
    paramType === "log" || paramType === "recipe" ? paramType : "recipe";
  const noun = entryTypeLabel(entryType).toLowerCase();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingRef = useRef(pendingImages);
  pendingRef.current = pendingImages;

  const initial = useMemo(() => {
    const orgs = user?.organizations ?? [];
    const paramVis = searchParams.get("visibility") as Visibility | null;
    const paramOrg = searchParams.get("organization_id");

    let visibility: Visibility;
    let organization_id: string | null = null;

    if (paramVis === "private" || paramVis === "organization" || paramVis === "global") {
      visibility = paramVis;
    } else if (orgs.length > 0) {
      visibility = "organization";
    } else {
      visibility = "private";
    }

    if (visibility === "organization") {
      organization_id =
        (paramOrg && orgs.some((o) => o.id === paramOrg) ? paramOrg : null) ||
        orgs[0]?.id ||
        null;
      if (!organization_id) {
        visibility = "private";
      }
    }

    return emptyRecipe(entryType, { visibility, organization_id });
  }, [entryType, searchParams, user]);

  useEffect(() => {
    const browse = browseSectionFromVisibility(initial.visibility, entryType);
    if (browse !== section) setSection(browse);
  }, [entryType, initial.visibility, section, setSection]);

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

  if (userLoading) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <main className="page">
      <h1 className="page-title">New {noun}</h1>
      <p className="page-sub">
        Capture plasma, NAIAD, sample, grid, graphene, and microscope settings
      </p>
      <RecipeForm
        key={`${entryType}-${initial.visibility}-${initial.organization_id ?? ""}`}
        initial={initial}
        submitLabel={`Create ${noun}`}
        onSubmit={handleSubmit}
      >
        <RecipeImages pending={pendingImages} onPendingChange={setPendingImages} />
      </RecipeForm>
    </main>
  );
}

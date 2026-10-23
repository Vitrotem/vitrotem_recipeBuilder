"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEntrySection } from "@/components/EntrySectionContext";
import PageLoading from "@/components/PageLoading";
import ProtocolForm from "@/components/ProtocolForm";
import ProtocolImages from "@/components/ProtocolImages";
import ProtocolMenu from "@/components/ProtocolMenu";
import ProtocolView from "@/components/ProtocolView";
import { useUser } from "@/components/UserContext";
import { deleteProtocol, getProtocol, setEntryType, updateProtocol } from "@/lib/api";
import {
  browseSectionFromVisibility,
  entryTypeLabel,
  type EntryType,
  type Protocol,
  type ProtocolImage,
  type ProtocolInput,
} from "@/lib/types";

const EMPTY_IMAGES: ProtocolImage[] = [];

export default function ProtocolDetailPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProtocolDetailInner />
    </Suspense>
  );
}

function ProtocolDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const router = useRouter();
  const { setSection } = useEntrySection();
  const { user } = useUser();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(
    searchParams.get("edit") === "1" ? "edit" : "view",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getProtocol(id)
      .then(setProtocol)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  useEffect(() => {
    if (!protocol) return;
    const next = browseSectionFromVisibility(protocol.visibility, protocol.entry_type ?? "protocol");
    setSection(next, protocol.organization_id ?? null);
  }, [protocol, setSection]);

  useEffect(() => {
    if (!protocol || !user) return;
    const owns = Boolean(protocol.owner_id && user.id === protocol.owner_id);
    if (!owns && mode === "edit") setMode("view");
  }, [protocol, user, mode]);

  useEffect(() => {
    if (!protocol || searchParams.get("saved") !== "1") return;
    setToast(`${entryTypeLabel(protocol.entry_type ?? "protocol")} saved`);
    router.replace(`/protocols/${id}`);
  }, [searchParams, id, router, protocol]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(data: ProtocolInput) {
    const updated = await updateProtocol(id, {
      ...data,
      entry_type: protocol?.entry_type ?? data.entry_type ?? "protocol",
    });
    setProtocol(updated);
    // Stay in edit so the save confirmation next to the button is visible
    router.replace(`/protocols/${id}`);
  }

  async function handleConvert() {
    if (!protocol) return;
    const next: EntryType = protocol.entry_type === "log" ? "protocol" : "log";
    const label =
      next === "protocol" ? "Upgrade to protocol?" : "Downgrade to log?";
    if (!confirm(label)) return;
    const updated = await setEntryType(id, next);
    setProtocol(updated);
    setSection(
      browseSectionFromVisibility(updated.visibility, next),
      updated.organization_id ?? null,
    );
    setToast(
      next === "protocol" ? "Upgraded to protocol" : "Downgraded to log",
    );
  }

  async function handleDelete() {
    const kind = protocol?.entry_type ?? "protocol";
    if (!confirm(`Delete this ${entryTypeLabel(kind).toLowerCase()}? This cannot be undone.`)) {
      return;
    }
    await deleteProtocol(id);
    router.push("/");
  }

  if (error) {
    return (
      <main className="page">
        <div className="alert">{error}</div>
      </main>
    );
  }

  if (!protocol) {
    return (
      <main className="page">
        <PageLoading />
      </main>
    );
  }

  const kind = protocol.entry_type ?? "protocol";
  const noun = entryTypeLabel(kind).toLowerCase();
  const isOwner = Boolean(user?.id && protocol.owner_id && user.id === protocol.owner_id);
  const editMode = mode === "edit" && isOwner;

  const initial: ProtocolInput = {
    name: protocol.name,
    entry_type: kind,
    modality: protocol.modality,
    author: protocol.author,
    tags: protocol.tags,
    notes: protocol.notes,
    plasma: protocol.plasma || {},
    naiad: protocol.naiad || {},
    sample: protocol.sample || {},
    grid: protocol.grid || {},
    graphene: protocol.graphene || {},
    microscope: protocol.microscope || {},
    outcome: protocol.outcome || {},
    visibility: protocol.visibility ?? "global",
    organization_id: protocol.organization_id ?? null,
  };

  return (
    <main className="page">
      <div className="protocol-page-header">
        <div>
          <h1 className="page-title">{protocol.name}</h1>
          <p className="page-sub">
            {editMode
              ? `Edit ${noun} parameters and outcome`
              : `${entryTypeLabel(kind)} details`}
          </p>
        </div>
        <div className="protocol-page-actions">
          {toast && <span className="toast success toast-inline">{toast}</span>}
          {editMode && (
            <button type="button" className="btn btn-ghost" onClick={() => setMode("view")}>
              Cancel
            </button>
          )}
          {isOwner && (
            <ProtocolMenu
              entryType={kind}
              onEdit={() => setMode("edit")}
              onConvert={() => void handleConvert()}
              onDelete={() => void handleDelete()}
            />
          )}
        </div>
      </div>

      {editMode ? (
        <ProtocolForm
          key={`${protocol.id}-edit`}
          initial={initial}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      ) : (
        <ProtocolView protocol={protocol} />
      )}

      <ProtocolImages
        protocolId={protocol.id}
        images={protocol.images ?? EMPTY_IMAGES}
        onChange={setProtocol}
        readOnly={!editMode}
      />
    </main>
  );
}

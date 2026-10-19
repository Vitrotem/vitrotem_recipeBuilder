"use client";

import { useState } from "react";
import type { RecipeInput } from "@/lib/types";

type Props = {
  initial: RecipeInput;
  submitLabel: string;
  onSubmit: (data: RecipeInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function num(value: string): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function RecipeForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const [form, setForm] = useState<RecipeInput>(initial);
  const [tagsText, setTagsText] = useState((initial.tags || []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchSection<S extends "plasma" | "naiad" | "sample" | "grid" | "graphene" | "microscope" | "outcome">(
    section: S,
    key: string,
    value: unknown,
  ) {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({ ...form, tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this recipe?")) return;
    setSaving(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setSaving(false);
    }
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      {error && <div className="alert">{error}</div>}

      <section className="form-section">
        <h2>Metadata</h2>
        <div className="grid-2">
          <label>
            Recipe name
            <input
              required
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="e.g. Apoferritin cryo sandwich v3"
            />
          </label>
          <label>
            Modality
            <select
              value={form.modality}
              onChange={(e) => patch("modality", e.target.value as RecipeInput["modality"])}
            >
              <option value="cryo">Cryo-EM</option>
              <option value="rt">Room temperature</option>
            </select>
          </label>
          <label>
            Author
            <input value={form.author || ""} onChange={(e) => patch("author", e.target.value)} />
          </label>
          <label>
            Tags (comma-separated)
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="protein, NAIAD" />
          </label>
        </div>
        <label>
          Notes
          <textarea
            rows={3}
            value={form.notes || ""}
            onChange={(e) => patch("notes", e.target.value)}
          />
        </label>
      </section>

      <section className="form-section">
        <h2>Plasma cleaner</h2>
        <div className="grid-2">
          <label>
            Model
            <input
              value={form.plasma.model || ""}
              onChange={(e) => patchSection("plasma", "model", e.target.value || null)}
              placeholder="GloQube / Harrick / other"
            />
          </label>
          <label>
            Gas
            <input
              value={form.plasma.gas || ""}
              onChange={(e) => patchSection("plasma", "gas", e.target.value || null)}
              placeholder="O₂, Ar, H₂/O₂…"
            />
          </label>
          <label>
            Duration (s)
            <input
              type="number"
              step="any"
              value={form.plasma.duration_s ?? ""}
              onChange={(e) => patchSection("plasma", "duration_s", num(e.target.value))}
            />
          </label>
          <label>
            Power (W or %)
            <input
              type="number"
              step="any"
              value={form.plasma.power ?? ""}
              onChange={(e) => patchSection("plasma", "power", num(e.target.value))}
            />
          </label>
          <label>
            Target
            <select
              value={form.plasma.target || ""}
              onChange={(e) =>
                patchSection("plasma", "target", e.target.value || null)
              }
            >
              <option value="">—</option>
              <option value="bottom">Bottom layer</option>
              <option value="top">Top layer</option>
              <option value="both">Both</option>
            </select>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>NAIAD</h2>
        <div className="grid-2">
          <label>
            Blot time (ms)
            <input
              type="number"
              step="any"
              value={form.naiad.blot_time_ms ?? ""}
              onChange={(e) => patchSection("naiad", "blot_time_ms", num(e.target.value))}
            />
          </label>
          <label>
            RH setpoint (%)
            <input
              type="number"
              step="any"
              value={form.naiad.rh_percent ?? ""}
              onChange={(e) => patchSection("naiad", "rh_percent", num(e.target.value))}
            />
          </label>
          <label>
            Blot count
            <input
              type="number"
              value={form.naiad.blot_count ?? ""}
              onChange={(e) => patchSection("naiad", "blot_count", num(e.target.value))}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(form.naiad.humidifier_enabled)}
              onChange={(e) => patchSection("naiad", "humidifier_enabled", e.target.checked)}
            />
            Humidifier enabled
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Sample</h2>
        <div className="grid-2">
          <label>
            Class
            <input
              value={form.sample.sample_class || ""}
              onChange={(e) => patchSection("sample", "sample_class", e.target.value || null)}
              placeholder="protein, NP, virus…"
            />
          </label>
          <label>
            Subtype
            <input
              value={form.sample.subtype || ""}
              onChange={(e) => patchSection("sample", "subtype", e.target.value || null)}
            />
          </label>
          <label>
            Size (nm)
            <input
              type="number"
              step="any"
              value={form.sample.size_nm ?? ""}
              onChange={(e) => patchSection("sample", "size_nm", num(e.target.value))}
            />
          </label>
          <label>
            Concentration
            <input
              type="number"
              step="any"
              value={form.sample.concentration ?? ""}
              onChange={(e) => patchSection("sample", "concentration", num(e.target.value))}
            />
          </label>
          <label>
            Concentration unit
            <input
              value={form.sample.concentration_unit || ""}
              onChange={(e) =>
                patchSection("sample", "concentration_unit", e.target.value || null)
              }
              placeholder="mg/mL, µM…"
            />
          </label>
          <label>
            Buffer
            <input
              value={form.sample.buffer || ""}
              onChange={(e) => patchSection("sample", "buffer", e.target.value || null)}
            />
          </label>
          <label>
            pH
            <input
              type="number"
              step="any"
              value={form.sample.ph ?? ""}
              onChange={(e) => patchSection("sample", "ph", num(e.target.value))}
            />
          </label>
          <label>
            Volume (nL)
            <input
              type="number"
              step="any"
              value={form.sample.volume_nl ?? ""}
              onChange={(e) => patchSection("sample", "volume_nl", num(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Grid</h2>
        <div className="grid-2">
          <label>
            Product / model
            <input
              value={form.grid.product || ""}
              onChange={(e) => patchSection("grid", "product", e.target.value || null)}
              placeholder="Quantifoil, UltrAuFoil…"
            />
          </label>
          <label>
            Mesh
            <input
              value={form.grid.mesh || ""}
              onChange={(e) => patchSection("grid", "mesh", e.target.value || null)}
              placeholder="200 / 300 / 400"
            />
          </label>
          <label>
            Hole size (µm)
            <input
              type="number"
              step="any"
              value={form.grid.hole_size_um ?? ""}
              onChange={(e) => patchSection("grid", "hole_size_um", num(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Graphene</h2>
        <div className="grid-2">
          <label>
            Bottom layer
            <input
              value={form.graphene.bottom_layer || ""}
              onChange={(e) => patchSection("graphene", "bottom_layer", e.target.value || null)}
            />
          </label>
          <label>
            Top layer
            <input
              value={form.graphene.top_layer || ""}
              onChange={(e) => patchSection("graphene", "top_layer", e.target.value || null)}
            />
          </label>
          <label>
            Cleaning method
            <input
              value={form.graphene.cleaning_method || ""}
              onChange={(e) =>
                patchSection("graphene", "cleaning_method", e.target.value || null)
              }
              placeholder="plasma, anneal, solvent…"
            />
          </label>
          <label>
            Target thickness (nm)
            <input
              type="number"
              step="any"
              value={form.graphene.target_thickness_nm ?? ""}
              onChange={(e) =>
                patchSection("graphene", "target_thickness_nm", num(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Microscope</h2>
        <div className="grid-2">
          <label>
            Instrument
            <input
              value={form.microscope.instrument || ""}
              onChange={(e) => patchSection("microscope", "instrument", e.target.value || null)}
            />
          </label>
          <label>
            Voltage (kV)
            <input
              type="number"
              step="any"
              value={form.microscope.voltage_kv ?? ""}
              onChange={(e) => patchSection("microscope", "voltage_kv", num(e.target.value))}
            />
          </label>
          <label>
            Magnification
            <input
              type="number"
              step="any"
              value={form.microscope.magnification ?? ""}
              onChange={(e) => patchSection("microscope", "magnification", num(e.target.value))}
            />
          </label>
          <label>
            Pixel size (Å)
            <input
              type="number"
              step="any"
              value={form.microscope.pixel_size_A ?? ""}
              onChange={(e) => patchSection("microscope", "pixel_size_A", num(e.target.value))}
            />
          </label>
          <label>
            Defocus (µm)
            <input
              type="number"
              step="any"
              value={form.microscope.defocus_um ?? ""}
              onChange={(e) => patchSection("microscope", "defocus_um", num(e.target.value))}
            />
          </label>
          <label>
            Dose rate (e⁻/Å²/s)
            <input
              type="number"
              step="any"
              value={form.microscope.dose_rate ?? ""}
              onChange={(e) => patchSection("microscope", "dose_rate", num(e.target.value))}
            />
          </label>
          <label>
            Total dose (e⁻/Å²)
            <input
              type="number"
              step="any"
              value={form.microscope.total_dose ?? ""}
              onChange={(e) => patchSection("microscope", "total_dose", num(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Outcome</h2>
        <div className="grid-2">
          <label>
            Status
            <select
              value={form.outcome.status || ""}
              onChange={(e) => patchSection("outcome", "status", e.target.value || null)}
            >
              <option value="">—</option>
              <option value="good">Good</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label>
            Failure mode
            <input
              value={form.outcome.failure_mode || ""}
              onChange={(e) => patchSection("outcome", "failure_mode", e.target.value || null)}
              placeholder="thick ice, tear, dry…"
            />
          </label>
        </div>
        <label>
          Outcome note
          <textarea
            rows={2}
            value={form.outcome.note || ""}
            onChange={(e) => patchSection("outcome", "note", e.target.value || null)}
          />
        </label>
      </section>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onDelete && (
          <button type="button" className="btn btn-danger" disabled={saving} onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

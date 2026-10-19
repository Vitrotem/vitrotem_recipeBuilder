"use client";

import { useState } from "react";
import type { RecipeInput } from "@/lib/types";
import SelectOrOther from "./SelectOrOther";
import SelectOrOtherNumber from "./SelectOrOtherNumber";
import {
  BLOT_COUNTS,
  BLOT_TIMES_MS,
  BUFFERS,
  CONCENTRATION_UNITS,
  DEFOCUS_UM,
  FAILURE_MODES,
  GRAPHENE_CLEANING,
  GRAPHENE_LAYERS,
  GRID_MESH,
  GRID_PRODUCTS,
  HOLE_SIZES_UM,
  MAGNIFICATIONS,
  MICROSCOPES,
  PIXEL_SIZES_A,
  PLASMA_DURATIONS_S,
  PLASMA_GASES,
  PLASMA_MODELS,
  PLASMA_POWER,
  RH_PERCENT,
  SAMPLE_CLASSES,
  SAMPLE_SUBTYPES,
  SAMPLE_VOLUMES_NL,
  TARGET_THICKNESS_NM,
  VOLTAGE_KV,
} from "@/lib/formOptions";

type Props = {
  initial: RecipeInput;
  submitLabel: string;
  onSubmit: (data: RecipeInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function RecipeForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const [form, setForm] = useState<RecipeInput>(initial);
  const [tagsText, setTagsText] = useState((initial.tags || []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchSection<
    S extends "plasma" | "naiad" | "sample" | "grid" | "graphene" | "microscope" | "outcome",
  >(section: S, key: string, value: unknown) {
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
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="protein, NAIAD, graphene"
            />
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
          <SelectOrOther
            label="Model"
            value={form.plasma.model}
            options={PLASMA_MODELS}
            onChange={(v) => patchSection("plasma", "model", v)}
          />
          <SelectOrOther
            label="Gas"
            value={form.plasma.gas}
            options={PLASMA_GASES}
            onChange={(v) => patchSection("plasma", "gas", v)}
          />
          <SelectOrOtherNumber
            label="Duration (s)"
            value={form.plasma.duration_s}
            options={PLASMA_DURATIONS_S}
            onChange={(v) => patchSection("plasma", "duration_s", v)}
          />
          <SelectOrOtherNumber
            label="Power (W)"
            value={form.plasma.power}
            options={PLASMA_POWER}
            onChange={(v) => patchSection("plasma", "power", v)}
          />
          <label>
            Target
            <select
              value={form.plasma.target || ""}
              onChange={(e) => patchSection("plasma", "target", e.target.value || null)}
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
          <SelectOrOtherNumber
            label="Blot time (ms)"
            value={form.naiad.blot_time_ms}
            options={BLOT_TIMES_MS}
            onChange={(v) => patchSection("naiad", "blot_time_ms", v)}
          />
          <SelectOrOtherNumber
            label="RH setpoint (%)"
            value={form.naiad.rh_percent}
            options={RH_PERCENT}
            onChange={(v) => patchSection("naiad", "rh_percent", v)}
          />
          <SelectOrOtherNumber
            label="Blot count"
            value={form.naiad.blot_count}
            options={BLOT_COUNTS}
            onChange={(v) => patchSection("naiad", "blot_count", v)}
          />
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
          <SelectOrOther
            label="Class"
            value={form.sample.sample_class}
            options={SAMPLE_CLASSES}
            onChange={(v) => patchSection("sample", "sample_class", v)}
          />
          <SelectOrOther
            label="Subtype"
            value={form.sample.subtype}
            options={SAMPLE_SUBTYPES}
            onChange={(v) => patchSection("sample", "subtype", v)}
          />
          <label>
            Size (nm)
            <input
              type="number"
              step="any"
              value={form.sample.size_nm ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchSection("sample", "size_nm", v === "" ? null : Number(v));
              }}
            />
          </label>
          <label>
            Concentration
            <input
              type="number"
              step="any"
              value={form.sample.concentration ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchSection("sample", "concentration", v === "" ? null : Number(v));
              }}
            />
          </label>
          <SelectOrOther
            label="Concentration unit"
            value={form.sample.concentration_unit}
            options={CONCENTRATION_UNITS}
            onChange={(v) => patchSection("sample", "concentration_unit", v)}
          />
          <SelectOrOther
            label="Buffer"
            value={form.sample.buffer}
            options={BUFFERS}
            onChange={(v) => patchSection("sample", "buffer", v)}
          />
          <label>
            pH
            <input
              type="number"
              step="any"
              value={form.sample.ph ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchSection("sample", "ph", v === "" ? null : Number(v));
              }}
            />
          </label>
          <SelectOrOtherNumber
            label="Volume (nL)"
            value={form.sample.volume_nl}
            options={SAMPLE_VOLUMES_NL}
            onChange={(v) => patchSection("sample", "volume_nl", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <h2>Grid</h2>
        <div className="grid-2">
          <SelectOrOther
            label="Product / model"
            value={form.grid.product}
            options={GRID_PRODUCTS}
            onChange={(v) => patchSection("grid", "product", v)}
          />
          <SelectOrOther
            label="Mesh"
            value={form.grid.mesh}
            options={GRID_MESH}
            onChange={(v) => patchSection("grid", "mesh", v)}
          />
          <SelectOrOtherNumber
            label="Hole size (µm)"
            value={form.grid.hole_size_um}
            options={HOLE_SIZES_UM}
            onChange={(v) => patchSection("grid", "hole_size_um", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <h2>Graphene</h2>
        <div className="grid-2">
          <SelectOrOther
            label="Bottom layer"
            value={form.graphene.bottom_layer}
            options={GRAPHENE_LAYERS}
            onChange={(v) => patchSection("graphene", "bottom_layer", v)}
          />
          <SelectOrOther
            label="Top layer"
            value={form.graphene.top_layer}
            options={GRAPHENE_LAYERS}
            onChange={(v) => patchSection("graphene", "top_layer", v)}
          />
          <SelectOrOther
            label="Cleaning method"
            value={form.graphene.cleaning_method}
            options={GRAPHENE_CLEANING}
            onChange={(v) => patchSection("graphene", "cleaning_method", v)}
          />
          <SelectOrOtherNumber
            label="Target thickness (nm)"
            value={form.graphene.target_thickness_nm}
            options={TARGET_THICKNESS_NM}
            onChange={(v) => patchSection("graphene", "target_thickness_nm", v)}
          />
        </div>
      </section>

      <section className="form-section">
        <h2>Microscope</h2>
        <div className="grid-2">
          <SelectOrOther
            label="Instrument"
            value={form.microscope.instrument}
            options={MICROSCOPES}
            onChange={(v) => patchSection("microscope", "instrument", v)}
          />
          <SelectOrOtherNumber
            label="Voltage (kV)"
            value={form.microscope.voltage_kv}
            options={VOLTAGE_KV}
            onChange={(v) => patchSection("microscope", "voltage_kv", v)}
          />
          <SelectOrOtherNumber
            label="Magnification"
            value={form.microscope.magnification}
            options={MAGNIFICATIONS}
            onChange={(v) => patchSection("microscope", "magnification", v)}
          />
          <SelectOrOtherNumber
            label="Pixel size (Å)"
            value={form.microscope.pixel_size_A}
            options={PIXEL_SIZES_A}
            onChange={(v) => patchSection("microscope", "pixel_size_A", v)}
          />
          <SelectOrOtherNumber
            label="Defocus (µm)"
            value={form.microscope.defocus_um}
            options={DEFOCUS_UM}
            onChange={(v) => patchSection("microscope", "defocus_um", v)}
          />
          <label>
            Dose rate (e⁻/Å²/s)
            <input
              type="number"
              step="any"
              value={form.microscope.dose_rate ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchSection("microscope", "dose_rate", v === "" ? null : Number(v));
              }}
            />
          </label>
          <label>
            Total dose (e⁻/Å²)
            <input
              type="number"
              step="any"
              value={form.microscope.total_dose ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchSection("microscope", "total_dose", v === "" ? null : Number(v));
              }}
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
          <SelectOrOther
            label="Failure mode"
            value={form.outcome.failure_mode}
            options={FAILURE_MODES}
            onChange={(v) => patchSection("outcome", "failure_mode", v)}
          />
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

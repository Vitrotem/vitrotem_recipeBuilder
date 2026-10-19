"use client";

import type { Recipe } from "@/lib/types";

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="view-field">
      <dt>{label}</dt>
      <dd>{display}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const hasContent = items.some((c) => c != null && c !== false);
  if (!hasContent) return null;
  return (
    <section className="form-section view-section">
      <h2>{title}</h2>
      <dl className="view-grid">{children}</dl>
    </section>
  );
}

export default function RecipeView({ recipe }: { recipe: Recipe }) {
  const { plasma, naiad, sample, grid, graphene, microscope, outcome } = recipe;

  return (
    <div className="recipe-view">
      <section className="form-section view-section">
        <h2>Metadata</h2>
        <dl className="view-grid">
          <Field label="Modality" value={recipe.modality === "cryo" ? "Cryo-EM" : "Room temperature"} />
          <Field label="Author" value={recipe.author} />
          <Field label="Tags" value={recipe.tags?.length ? recipe.tags.join(", ") : null} />
          <Field
            label="Updated"
            value={recipe.updated_at ? new Date(recipe.updated_at).toLocaleString() : null}
          />
        </dl>
        {recipe.notes ? (
          <div className="view-notes">
            <h3>Notes</h3>
            <p>{recipe.notes}</p>
          </div>
        ) : null}
      </section>

      <Section title="Plasma cleaner">
        <Field label="Model" value={plasma?.model} />
        <Field label="Gas" value={plasma?.gas} />
        <Field label="Duration (s)" value={plasma?.duration_s} />
        <Field label="Power (W)" value={plasma?.power} />
        <Field label="Target" value={plasma?.target} />
      </Section>

      <Section title="NAIAD">
        <Field label="Blot time (ms)" value={naiad?.blot_time_ms} />
        <Field label="RH setpoint (%)" value={naiad?.rh_percent} />
        <Field label="Blot count" value={naiad?.blot_count} />
        <Field label="Humidifier" value={naiad?.humidifier_enabled} />
      </Section>

      <Section title="Sample">
        <Field label="Class" value={sample?.sample_class} />
        <Field label="Subtype" value={sample?.subtype} />
        <Field label="Size (nm)" value={sample?.size_nm} />
        <Field
          label="Concentration"
          value={
            sample?.concentration != null
              ? `${sample.concentration}${sample.concentration_unit ? ` ${sample.concentration_unit}` : ""}`
              : null
          }
        />
        <Field label="Buffer" value={sample?.buffer} />
        <Field label="pH" value={sample?.ph} />
        <Field label="Volume (nL)" value={sample?.volume_nl} />
      </Section>

      <Section title="Grid">
        <Field label="Product" value={grid?.product} />
        <Field label="Mesh" value={grid?.mesh} />
        <Field label="Hole size (µm)" value={grid?.hole_size_um} />
      </Section>

      <Section title="Graphene">
        <Field label="Bottom layer" value={graphene?.bottom_layer} />
        <Field label="Top layer" value={graphene?.top_layer} />
        <Field label="Cleaning method" value={graphene?.cleaning_method} />
        <Field label="Target thickness (nm)" value={graphene?.target_thickness_nm} />
      </Section>

      <Section title="Microscope">
        <Field label="Instrument" value={microscope?.instrument} />
        <Field label="Voltage (kV)" value={microscope?.voltage_kv} />
        <Field label="Magnification" value={microscope?.magnification} />
        <Field label="Pixel size (Å)" value={microscope?.pixel_size_A} />
        <Field label="Defocus (µm)" value={microscope?.defocus_um} />
        <Field label="Dose rate" value={microscope?.dose_rate} />
        <Field label="Total dose" value={microscope?.total_dose} />
      </Section>

      <Section title="Outcome">
        <Field label="Status" value={outcome?.status} />
        <Field label="Failure mode" value={outcome?.failure_mode} />
        <Field label="Note" value={outcome?.note} />
      </Section>
    </div>
  );
}

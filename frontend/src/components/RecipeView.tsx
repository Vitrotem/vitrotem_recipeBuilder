"use client";

import type { ReactNode } from "react";
import type { Recipe } from "@/lib/types";

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="view-param">
      <span className="view-param-label">{label}</span>
      <span className="view-param-value">{display}</span>
    </div>
  );
}

function Section({ title, fields }: { title: string; fields: ReactNode[] }) {
  const visible = fields.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <section className="view-section">
      <h2>{title}</h2>
      <div className="view-param-grid">{visible}</div>
    </section>
  );
}

export default function RecipeView({ recipe }: { recipe: Recipe }) {
  const { plasma, naiad, sample, grid, graphene, microscope, outcome } = recipe;

  return (
    <div className="recipe-view">
      <Section
        title="Metadata"
        fields={[
          <Field
            key="mod"
            label="Modality"
            value={recipe.modality === "cryo" ? "Cryo-EM" : "Room temperature"}
          />,
          <Field key="author" label="Author" value={recipe.author} />,
          <Field key="tags" label="Tags" value={recipe.tags?.length ? recipe.tags.join(", ") : null} />,
          <Field
            key="upd"
            label="Updated"
            value={recipe.updated_at ? new Date(recipe.updated_at).toLocaleString() : null}
          />,
          recipe.notes ? (
            <div key="notes" className="view-param view-param-wide">
              <span className="view-param-label">Notes</span>
              <span className="view-param-value view-param-notes">{recipe.notes}</span>
            </div>
          ) : null,
        ]}
      />

      <Section
        title="Sample"
        fields={[
          <Field key="c" label="Class" value={sample?.sample_class} />,
          <Field key="s" label="Subtype" value={sample?.subtype} />,
          <Field key="sz" label="Size (nm)" value={sample?.size_nm} />,
          <Field
            key="conc"
            label="Concentration"
            value={
              sample?.concentration != null
                ? `${sample.concentration}${sample.concentration_unit ? ` ${sample.concentration_unit}` : ""}`
                : null
            }
          />,
          <Field key="b" label="Buffer" value={sample?.buffer} />,
          <Field key="ph" label="pH" value={sample?.ph} />,
          <Field key="v" label="Volume (nL)" value={sample?.volume_nl} />,
        ]}
      />

      <Section
        title="Plasma cleaner"
        fields={[
          <Field key="m" label="Model" value={plasma?.model} />,
          <Field key="g" label="Gas" value={plasma?.gas} />,
          <Field key="d" label="Duration (s)" value={plasma?.duration_s} />,
          <Field key="p" label="Power (W)" value={plasma?.power} />,
          <Field key="t" label="Target" value={plasma?.target} />,
        ]}
      />

      <Section
        title="Grid"
        fields={[
          <Field key="p" label="Product" value={grid?.product} />,
          <Field key="m" label="Mesh" value={grid?.mesh} />,
          <Field key="h" label="Hole size (µm)" value={grid?.hole_size_um} />,
        ]}
      />

      <Section
        title="Graphene"
        fields={[
          <Field key="b" label="Bottom layer" value={graphene?.bottom_layer} />,
          <Field key="t" label="Top layer" value={graphene?.top_layer} />,
          <Field key="c" label="Cleaning method" value={graphene?.cleaning_method} />,
          <Field key="th" label="Target thickness (nm)" value={graphene?.target_thickness_nm} />,
        ]}
      />

      <Section
        title="NAIAD"
        fields={[
          <Field key="bt" label="Blot time (ms)" value={naiad?.blot_time_ms} />,
          <Field key="rh" label="RH setpoint (%)" value={naiad?.rh_percent} />,
          <Field key="bc" label="Blot count" value={naiad?.blot_count} />,
          <Field key="h" label="Humidifier" value={naiad?.humidifier_enabled} />,
        ]}
      />

      <Section
        title="Microscope"
        fields={[
          <Field key="i" label="Instrument" value={microscope?.instrument} />,
          <Field key="v" label="Voltage (kV)" value={microscope?.voltage_kv} />,
          <Field key="m" label="Magnification" value={microscope?.magnification} />,
          <Field key="px" label="Pixel size (Å)" value={microscope?.pixel_size_A} />,
          <Field key="df" label="Defocus (µm)" value={microscope?.defocus_um} />,
          <Field key="dr" label="Dose rate" value={microscope?.dose_rate} />,
          <Field key="td" label="Total dose" value={microscope?.total_dose} />,
        ]}
      />

      <Section
        title="Outcome"
        fields={[
          <Field key="s" label="Status" value={outcome?.status} />,
          <Field key="f" label="Failure mode" value={outcome?.failure_mode} />,
          <Field key="n" label="Note" value={outcome?.note} />,
        ]}
      />
    </div>
  );
}

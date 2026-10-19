export type Modality = "cryo" | "rt";
export type PlasmaTarget = "bottom" | "top" | "both";
export type OutcomeStatus = "good" | "partial" | "failed";

export interface PlasmaSettings {
  model?: string | null;
  gas?: string | null;
  duration_s?: number | null;
  power?: number | null;
  target?: PlasmaTarget | null;
}

export interface NaiadSettings {
  blot_time_ms?: number | null;
  humidifier_enabled?: boolean | null;
  rh_percent?: number | null;
  blot_count?: number | null;
}

export interface SampleSettings {
  sample_class?: string | null;
  subtype?: string | null;
  size_nm?: number | null;
  concentration?: number | null;
  concentration_unit?: string | null;
  buffer?: string | null;
  ph?: number | null;
  volume_nl?: number | null;
}

export interface GridSettings {
  product?: string | null;
  mesh?: string | null;
  hole_size_um?: number | null;
}

export interface GrapheneSettings {
  bottom_layer?: string | null;
  top_layer?: string | null;
  cleaning_method?: string | null;
  target_thickness_nm?: number | null;
}

export interface MicroscopeSettings {
  instrument?: string | null;
  voltage_kv?: number | null;
  magnification?: number | null;
  pixel_size_A?: number | null;
  defocus_um?: number | null;
  dose_rate?: number | null;
  total_dose?: number | null;
}

export interface OutcomeSettings {
  status?: OutcomeStatus | null;
  failure_mode?: string | null;
  note?: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  modality: Modality;
  author?: string | null;
  tags: string[];
  notes?: string | null;
  plasma: PlasmaSettings;
  naiad: NaiadSettings;
  sample: SampleSettings;
  grid: GridSettings;
  graphene: GrapheneSettings;
  microscope: MicroscopeSettings;
  outcome: OutcomeSettings;
  created_at: string;
  updated_at: string;
}

export type RecipeInput = Omit<Recipe, "id" | "created_at" | "updated_at">;

export function emptyRecipe(): RecipeInput {
  return {
    name: "",
    modality: "cryo",
    author: "",
    tags: [],
    notes: "",
    plasma: {},
    naiad: { humidifier_enabled: false },
    sample: {},
    grid: {},
    graphene: {},
    microscope: {},
    outcome: {},
  };
}

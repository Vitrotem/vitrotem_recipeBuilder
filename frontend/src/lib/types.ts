export type EntryType = "recipe" | "log";
export type Modality = "cryo" | "rt";
export type PlasmaTarget = "bottom" | "top" | "both";
export type OutcomeStatus = "good" | "partial" | "failed";
export type Visibility = "private" | "organization" | "global";
export type BrowseSection = "recipe" | "log" | "personal" | "organization";

export function entryTypeLabel(type: EntryType, plural = false): string {
  if (type === "log") return plural ? "Logs" : "Log";
  return plural ? "Recipes" : "Recipe";
}

export function browseSectionLabel(section: BrowseSection): string {
  switch (section) {
    case "log":
      return "Logs";
    case "personal":
      return "Personal";
    case "organization":
      return "Organization";
    default:
      return "Recipes";
  }
}

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
  bottom_layer_transfer_method?: string | null;
  bottom_layer_vendor?: string | null;
  vitrotem_batch?: string | null;
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

export interface RecipeImage {
  id: string;
  filename: string;
  content_type: string;
  caption?: string | null;
  kind?: string | null;
  size_bytes: number;
  created_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  entry_type: EntryType;
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
  visibility: Visibility;
  organization_id?: string | null;
  owner_id?: string | null;
  images?: RecipeImage[];
  created_at: string;
  updated_at: string;
}

export type RecipeInput = Omit<Recipe, "id" | "created_at" | "updated_at" | "images" | "owner_id">;

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface MeUser {
  id: string;
  username: string;
  organizations: Organization[];
}

export function emptyRecipe(
  entryType: EntryType = "recipe",
  opts?: { visibility?: Visibility; organization_id?: string | null },
): RecipeInput {
  return {
    name: "",
    entry_type: entryType,
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
    visibility: opts?.visibility ?? "private",
    organization_id: opts?.organization_id ?? null,
  };
}

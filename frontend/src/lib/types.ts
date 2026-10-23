export type EntryType = "protocol" | "log";
export type Modality = "cryo" | "rt";
export type PlasmaTarget = "bottom" | "top" | "both";
export type OutcomeStatus = "good" | "partial" | "failed";
export type Visibility = "private" | "organization" | "global";
export type BrowseSection =
  | "protocol"
  | "log"
  | "personal-protocol"
  | "personal-log"
  | "organization-protocol"
  | "organization-log";

export function entryTypeLabel(type: EntryType, plural = false): string {
  if (type === "log") return plural ? "Logs" : "Log";
  return plural ? "Protocols" : "Protocol";
}

export function browseSectionScope(
  section: BrowseSection,
): "personal" | "organization" | "global" {
  if (section.startsWith("personal-")) return "personal";
  if (section.startsWith("organization-")) return "organization";
  return "global";
}

export function browseSectionEntryType(section: BrowseSection): EntryType {
  return section.endsWith("log") ? "log" : "protocol";
}

export function browseSectionFromVisibility(
  visibility: Visibility | undefined,
  entryType: EntryType,
): BrowseSection {
  if (visibility === "private") {
    return entryType === "log" ? "personal-log" : "personal-protocol";
  }
  if (visibility === "organization") {
    return entryType === "log" ? "organization-log" : "organization-protocol";
  }
  return entryType;
}

export function browseSectionLabel(
  section: BrowseSection,
  orgName?: string | null,
): string {
  const type = browseSectionEntryType(section);
  const scope = browseSectionScope(section);
  const base = entryTypeLabel(type, true);
  if (scope === "personal") return `Private ${base.toLowerCase()}`;
  if (scope === "organization") {
    return orgName ? `${orgName} ${base.toLowerCase()}` : `Organization ${base.toLowerCase()}`;
  }
  return base;
}

export interface PlasmaSettings {
  model?: string | null;
  gas?: string | null;
  duration_s?: number | null;
  power?: number | null;
  target?: PlasmaTarget | null;
}

export const GRID_COUNT = 5;

export type BlotTimesMs = [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

export interface NaiadSettings {
  /** Per-grid blot times (5 slots). Legacy single `blot_time_ms` is migrated on load. */
  blot_times_ms?: BlotTimesMs | (number | null)[] | null;
  blot_time_ms?: number | null;
  humidifier_enabled?: boolean | null;
  rh_percent?: number | null;
  blot_count?: number | null;
}

export function emptyBlotTimes(): BlotTimesMs {
  return [null, null, null, null, null];
}

export function normalizeBlotTimes(
  naiad?: NaiadSettings | null,
): BlotTimesMs {
  const times = naiad?.blot_times_ms;
  if (Array.isArray(times)) {
    const out = emptyBlotTimes();
    for (let i = 0; i < GRID_COUNT; i++) {
      const v = times[i];
      out[i] = v == null || Number.isNaN(Number(v)) ? null : Number(v);
    }
    return out;
  }
  if (naiad?.blot_time_ms != null && !Number.isNaN(Number(naiad.blot_time_ms))) {
    const out = emptyBlotTimes();
    out[0] = Number(naiad.blot_time_ms);
    return out;
  }
  return emptyBlotTimes();
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
  glcs_visible?: boolean | null;
  sample_visible?: boolean | null;
}

export interface ProtocolImage {
  id: string;
  filename: string;
  content_type: string;
  caption?: string | null;
  kind?: string | null;
  size_bytes: number;
  created_at: string;
}

export interface Protocol {
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
  images?: ProtocolImage[];
  created_at: string;
  updated_at: string;
}

export type ProtocolInput = Omit<Protocol, "id" | "created_at" | "updated_at" | "images" | "owner_id">;

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
  icon_id?: string | null;
}

export interface MeUser {
  id: string;
  username: string;
  organizations: Organization[];
}

export function emptyProtocol(
  entryType: EntryType = "protocol",
  opts?: { visibility?: Visibility; organization_id?: string | null },
): ProtocolInput {
  return {
    name: "",
    entry_type: entryType,
    modality: "cryo",
    author: "",
    tags: [],
    notes: "",
    plasma: {},
    naiad: { humidifier_enabled: false, blot_times_ms: emptyBlotTimes() },
    sample: {},
    grid: {},
    graphene: {},
    microscope: {},
    outcome: {},
    visibility: opts?.visibility ?? "private",
    organization_id: opts?.organization_id ?? null,
  };
}

/** Common cryo-EM / graphene liquid-cell lab values for recipe form dropdowns. */

export const PLASMA_MODELS = [
  "VitroTEM / NAIAD integrated",
  "Quorum GloQube Plus",
  "Quorum GloQube",
  "Gatan Solarus II",
  "Gatan Solarus 950",
  "Harrick PDC-32G",
  "Harrick PDC-002",
  "Diener Zepto",
  "Diener Femto",
  "Plasma Etch PE-25",
  "Plasma Etch PE-50",
  "PIE Scientific Tergeo",
  "EMS 150T ES",
  "Ted Pella EasyGlow",
  "PELCO easiGlow",
  "Custom / lab-built",
] as const;

export const PLASMA_GASES = [
  "Air",
  "O₂",
  "Ar",
  "H₂",
  "N₂",
  "O₂/Ar mix",
  "H₂/O₂ mix (Solarus)",
  "H₂/N₂ mix",
  "Ar/O₂ mix",
] as const;

export const PLASMA_DURATIONS_S = [
  "5",
  "10",
  "15",
  "20",
  "30",
  "45",
  "60",
  "90",
  "120",
  "180",
  "300",
] as const;

export const PLASMA_POWER = [
  "5",
  "10",
  "15",
  "20",
  "25",
  "30",
  "40",
  "50",
  "75",
  "100",
  "150",
  "200",
] as const;

export const SAMPLE_CLASSES = [
  "Protein",
  "Protein complex",
  "Antibody / Fab",
  "Virus / VLP",
  "Bacteriophage",
  "Ribosome",
  "Liposome / vesicle",
  "Nanoparticle (metal)",
  "Nanoparticle (organic)",
  "Quantum dot",
  "Nanocrystal",
  "Nucleic acid",
  "Small molecule",
  "Cell lysate / extract",
  "Standard / fiducial only",
  "Buffer blank",
] as const;

export const SAMPLE_SUBTYPES = [
  "Apoferritin",
  "β-galactosidase",
  "GroEL",
  "20S proteasome",
  "Hemagglutinin",
  "Spike protein",
  "70S ribosome",
  "80S ribosome",
  "TMV",
  "AAV",
  "HIV-1 CA",
  "Gold NP 5 nm",
  "Gold NP 10 nm",
  "Gold NP 15 nm",
  "Gold NP 20 nm",
  "Polystyrene beads",
  "Liposome",
  "Custom",
] as const;

export const CONCENTRATION_UNITS = [
  "mg/mL",
  "µg/mL",
  "µM",
  "nM",
  "mM",
  "particles/mL",
  "OD260",
  "v/v %",
  "w/v %",
] as const;

export const BUFFERS = [
  "PBS pH 7.4",
  "PBS pH 7.2",
  "DPBS",
  "HEPES",
  "Tris-HCl",
  "Tris-HCl + NaCl",
  "Tris-glycine",
  "MOPS",
  "MES",
  "Potassium phosphate",
  "Sodium phosphate",
  "TBS",
  "HBS",
  "Water / Milli-Q",
  "Assay buffer (custom)",
] as const;

export const SAMPLE_VOLUMES_NL = [
  "50",
  "100",
  "200",
  "300",
  "500",
  "750",
  "1000",
  "1500",
  "2000",
  "3000",
  "5000",
] as const;

export const GRID_PRODUCTS = [
  "Quantifoil R1.2/1.3",
  "Quantifoil R2/1",
  "Quantifoil R2/2",
  "Quantifoil R1.2/1.3 Au",
  "Quantifoil R2/2 Au",
  "Quantifoil Multi A",
  "C-flat 1.2/1.3",
  "C-flat 2/1",
  "C-flat 2/2",
  "UltrAuFoil R1.2/1.3",
  "UltrAuFoil R0.6/1",
  "UltrAuFoil R2/2",
  "Holey carbon (generic)",
  "Lacey carbon",
  "Continuous carbon",
  "Formvar/carbon",
  "VitroTEM graphene kit grid",
  "Graphene-coated Quantifoil",
  "Custom / lab-made",
] as const;

export const GRID_MESH = ["200", "300", "400", "600", "1000"] as const;

export const HOLE_SIZES_UM = [
  "0.6",
  "1.0",
  "1.2",
  "1.3",
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "5.0",
] as const;

export const GRAPHENE_LAYERS = [
  "CVD monolayer graphene",
  "CVD bilayer graphene",
  "CVD few-layer graphene (3–5)",
  "Exfoliated graphene",
  "Graphene oxide (GO)",
  "Reduced graphene oxide (rGO)",
  "Commercial graphene TEM grid (pre-mounted)",
  "VitroTEM bottom graphene",
  "VitroTEM top graphene",
  "Graphene on Quantifoil",
  "Graphene on UltrAuFoil",
  "None / open face",
] as const;

export const GRAPHENE_TRANSFER_METHODS = ["Polymer", "Loop assisted"] as const;

export const GRAPHENE_CLEANING = [
  "None / as-received",
  "O₂ plasma (gentle)",
  "Ar plasma",
  "H₂/O₂ plasma (Solarus)",
  "Air glow discharge",
  "UV-ozone",
  "Thermal anneal (Ar/H₂)",
  "Thermal anneal (vacuum)",
  "Acetone / IPA rinse",
  "Chloroform rinse",
  "Critical-point dried",
  "Bake / oven dry",
] as const;

export const TARGET_THICKNESS_NM = [
  "10",
  "20",
  "30",
  "40",
  "50",
  "75",
  "100",
  "150",
  "200",
  "300",
  "500",
] as const;

export const MICROSCOPES = [
  "Thermo Fisher Krios G4",
  "Thermo Fisher Krios G3i",
  "Thermo Fisher Krios G3",
  "Thermo Fisher Glacios 2",
  "Thermo Fisher Glacios",
  "Thermo Fisher Talos Arctica",
  "Thermo Fisher Talos F200C",
  "Thermo Fisher Talos L120C",
  "Thermo Fisher Spectra 300",
  "Thermo Fisher Tecnai F20",
  "Thermo Fisher Tecnai F30",
  "JEOL CRYO ARM 300",
  "JEOL CRYO ARM 200",
  "JEOL JEM-2100",
  "JEOL JEM-2100F",
  "JEOL JEM-2200FS",
  "JEOL JEM-F200",
  "JEOL GrandARM",
  "Hitachi HT7800",
  "Hitachi H-9500",
  "Zeiss Libra 120",
  "Custom / other TEM",
] as const;

export const VOLTAGE_KV = ["80", "100", "120", "200", "300"] as const;

export const MAGNIFICATIONS = [
  "15000",
  "22000",
  "29000",
  "37000",
  "45000",
  "59000",
  "75000",
  "81000",
  "96000",
  "105000",
  "120000",
  "130000",
  "165000",
] as const;

export const PIXEL_SIZES_A = [
  "0.4",
  "0.5",
  "0.6",
  "0.7",
  "0.8",
  "0.83",
  "0.85",
  "0.9",
  "1.0",
  "1.05",
  "1.1",
  "1.2",
  "1.5",
  "2.0",
  "2.5",
  "3.0",
] as const;

export const DEFOCUS_UM = [
  "-0.5",
  "-0.8",
  "-1.0",
  "-1.2",
  "-1.5",
  "-2.0",
  "-2.5",
  "-3.0",
  "-4.0",
  "-5.0",
] as const;

export const BLOT_TIMES_MS = [
  "500",
  "1000",
  "1500",
  "2000",
  "2500",
  "3000",
  "3500",
  "4000",
  "5000",
  "6000",
  "8000",
  "10000",
] as const;

export const RH_PERCENT = [
  "70",
  "75",
  "80",
  "85",
  "90",
  "95",
  "98",
  "100",
] as const;

export const BLOT_COUNTS = ["1", "2", "3", "4"] as const;

export const FAILURE_MODES = [
  "Thick ice / thick liquid",
  "Dry hole / empty",
  "Uneven thickness",
  "Graphene tear / hole",
  "Graphene wrinkle / fold",
  "Contamination / dirt",
  "Beam damage",
  "No / few particles",
  "Aggregation",
  "Preferred orientation",
  "Bubble / gas pocket",
  "Delamination / seal fail",
  "Charging / drift",
  "Wrong focus / astigmatism",
  "Other",
] as const;

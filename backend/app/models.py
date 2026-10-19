from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Modality(str, Enum):
    cryo = "cryo"
    rt = "rt"


class PlasmaTarget(str, Enum):
    bottom = "bottom"
    top = "top"
    both = "both"


class OutcomeStatus(str, Enum):
    good = "good"
    partial = "partial"
    failed = "failed"


class PlasmaSettings(BaseModel):
    model: Optional[str] = None
    gas: Optional[str] = None
    duration_s: Optional[float] = None
    power: Optional[float] = None
    target: Optional[PlasmaTarget] = None


class NaiadSettings(BaseModel):
    blot_time_ms: Optional[float] = None
    humidifier_enabled: Optional[bool] = None
    rh_percent: Optional[float] = None
    blot_count: Optional[int] = None


class SampleSettings(BaseModel):
    sample_class: Optional[str] = None
    subtype: Optional[str] = None
    size_nm: Optional[float] = None
    concentration: Optional[float] = None
    concentration_unit: Optional[str] = None
    buffer: Optional[str] = None
    ph: Optional[float] = None
    volume_nl: Optional[float] = None


class GridSettings(BaseModel):
    product: Optional[str] = None
    mesh: Optional[str] = None
    hole_size_um: Optional[float] = None


class GrapheneSettings(BaseModel):
    bottom_layer: Optional[str] = None
    top_layer: Optional[str] = None
    cleaning_method: Optional[str] = None
    target_thickness_nm: Optional[float] = None


class MicroscopeSettings(BaseModel):
    instrument: Optional[str] = None
    voltage_kv: Optional[float] = None
    magnification: Optional[float] = None
    pixel_size_A: Optional[float] = None
    defocus_um: Optional[float] = None
    dose_rate: Optional[float] = None
    total_dose: Optional[float] = None


class OutcomeSettings(BaseModel):
    status: Optional[OutcomeStatus] = None
    failure_mode: Optional[str] = None
    note: Optional[str] = None


class RecipeImage(BaseModel):
    id: str
    filename: str
    content_type: str
    caption: Optional[str] = None
    kind: Optional[str] = None
    size_bytes: int
    created_at: datetime


class RecipeBase(BaseModel):
    name: str
    modality: Modality = Modality.cryo
    author: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    notes: Optional[str] = None
    plasma: PlasmaSettings = Field(default_factory=PlasmaSettings)
    naiad: NaiadSettings = Field(default_factory=NaiadSettings)
    sample: SampleSettings = Field(default_factory=SampleSettings)
    grid: GridSettings = Field(default_factory=GridSettings)
    graphene: GrapheneSettings = Field(default_factory=GrapheneSettings)
    microscope: MicroscopeSettings = Field(default_factory=MicroscopeSettings)
    outcome: OutcomeSettings = Field(default_factory=OutcomeSettings)


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(RecipeBase):
    pass


class RecipeOut(RecipeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    images: list[RecipeImage] = Field(default_factory=list)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

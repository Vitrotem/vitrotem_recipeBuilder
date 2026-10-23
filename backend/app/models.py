from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class EntryType(str, Enum):
    protocol = "protocol"
    log = "log"


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


class Visibility(str, Enum):
    private = "private"
    organization = "organization"
    globally_public = "global"


class PlasmaSettings(BaseModel):
    model: Optional[str] = None
    gas: Optional[str] = None
    duration_s: Optional[float] = None
    power: Optional[float] = None
    target: Optional[PlasmaTarget] = None


class NaiadSettings(BaseModel):
    blot_times_ms: list[Optional[float]] = Field(default_factory=lambda: [None] * 5)
    humidifier_enabled: Optional[bool] = None
    rh_percent: Optional[float] = None
    blot_count: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def migrate_legacy_blot_time(cls, data: object) -> object:
        if isinstance(data, dict) and "blot_times_ms" not in data and "blot_time_ms" in data:
            data = {**data, "blot_times_ms": data.get("blot_time_ms")}
        return data

    @field_validator("blot_times_ms", mode="before")
    @classmethod
    def normalize_blot_times(cls, v: object) -> list[Optional[float]]:
        if v is None:
            return [None] * 5
        if isinstance(v, (int, float)):
            return [float(v), None, None, None, None]
        if isinstance(v, list):
            times = list(v)[:5]
            while len(times) < 5:
                times.append(None)
            return times
        return [None] * 5


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
    bottom_layer_transfer_method: Optional[str] = None
    bottom_layer_vendor: Optional[str] = None
    vitrotem_batch: Optional[str] = None
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
    glcs_visible: Optional[bool] = None
    sample_visible: Optional[bool] = None


class ProtocolImage(BaseModel):
    id: str
    filename: str
    content_type: str
    caption: Optional[str] = None
    kind: Optional[str] = None
    size_bytes: int
    created_at: datetime


class ProtocolBase(BaseModel):
    name: str
    entry_type: EntryType = EntryType.protocol
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
    visibility: Visibility = Visibility.private
    organization_id: Optional[str] = None


class ProtocolCreate(ProtocolBase):
    pass


class ProtocolUpdate(ProtocolBase):
    pass


class EntryTypeUpdate(BaseModel):
    entry_type: EntryType


class ProtocolOut(ProtocolBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    images: list[ProtocolImage] = Field(default_factory=list)


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        name = v.strip()
        if len(name) < 2 or len(name) > 64:
            raise ValueError("Username must be 2–64 characters")
        if not all(c.isalnum() or c in "._-" for c in name):
            raise ValueError("Username may only contain letters, digits, ., _, -")
        return name

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrganizationOut(BaseModel):
    id: str
    name: str
    created_at: datetime
    icon_id: Optional[str] = None


class OrganizationMember(BaseModel):
    id: str
    username: str


class OrganizationCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_org_name(cls, v: str) -> str:
        name = v.strip()
        if not name:
            raise ValueError("Organization name is required")
        if len(name) > 64:
            raise ValueError("Organization name must be at most 64 characters")
        if name.startswith("-") or name.endswith("-") or "--" in name:
            raise ValueError("Organization name cannot start/end with or contain consecutive hyphens")
        if not all(c.isalnum() or c == "-" for c in name):
            raise ValueError("Organization name may only contain letters, digits, and hyphens")
        return name


class InviteCreateResponse(BaseModel):
    token: str
    expires_at: datetime


class InviteAcceptRequest(BaseModel):
    token: str


class MeOrganization(BaseModel):
    id: str
    name: str
    icon_id: Optional[str] = None


class MeResponse(BaseModel):
    id: str
    username: str
    organizations: list[MeOrganization] = Field(default_factory=list)

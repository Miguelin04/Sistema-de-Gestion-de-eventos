from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from typing import Optional
from app.models.evento import ProgresoEvento
from app.schemas.ubicacion import UbicacionResponse

# Esquema base con la información central del evento
# NOTA: Este validador solo verifica que fin > inicio.
# La validación de fechas pasadas NO va aquí para no romper EventoResponse.
class EventoBase(BaseModel):
    nombre: str = Field(..., min_length=5, max_length=150, description="Título del evento académico o actividad")
    descripcion: str = Field(..., min_length=10, max_length=500, description="Detalles completos de la actividad")
    fecha_hora_inicio: datetime = Field(..., description="Fecha y hora de inicio")
    fecha_hora_final: datetime = Field(..., description="Fecha y hora de finalización prevista")

    @model_validator(mode='after')
    def validar_fin_despues_de_inicio(self) -> 'EventoBase':
        if self.fecha_hora_final <= self.fecha_hora_inicio:
            raise ValueError("La fecha de finalización debe ser posterior a la fecha de inicio.")
        return self

# Esquema para CREAR un evento (agrega validación de fecha pasada)
class EventoCreate(EventoBase):
    id_ubicacion: int = Field(..., description="ID de la ubicación previamente registrada")

    @model_validator(mode='after')
    def validar_fecha_no_pasada(self) -> 'EventoCreate':
        ahora = datetime.now(self.fecha_hora_inicio.tzinfo) if self.fecha_hora_inicio.tzinfo else datetime.now()
        if self.fecha_hora_inicio.date() < ahora.date():
            raise ValueError("La fecha de inicio no puede ser anterior al día de hoy.")
        return self

# Esquema para ACTUALIZAR un evento existente
class EventoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=5, max_length=150)
    descripcion: Optional[str] = Field(None, min_length=10, max_length=500)
    fecha_hora_inicio: Optional[datetime] = None
    fecha_hora_final: Optional[datetime] = None
    estado: Optional[ProgresoEvento] = Field(None, description="Nuevo estado del evento")
    id_ubicacion: Optional[int] = None

    @model_validator(mode='after')
    def validar_fechas_update(self) -> 'EventoUpdate':
        if self.fecha_hora_inicio:
            ahora = datetime.now(self.fecha_hora_inicio.tzinfo) if self.fecha_hora_inicio.tzinfo else datetime.now()
            if self.fecha_hora_inicio.date() < ahora.date():
                raise ValueError("La fecha de inicio no puede ser anterior al día de hoy.")
        if self.fecha_hora_inicio and self.fecha_hora_final:
            if self.fecha_hora_final <= self.fecha_hora_inicio:
                raise ValueError("La fecha de finalización debe ser posterior a la fecha de inicio.")
        return self

# Esquema de respuesta al Frontend — hereda de EventoBase SIN validaciones de fecha pasada
class EventoResponse(EventoBase):
    id_evento: int
    estado: ProgresoEvento
    id_usuario: int
    ubicacion: UbicacionResponse
    imagen_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
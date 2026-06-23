from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria

def registrar_auditoria(
    db: Session,
    id_usuario: int,
    accion: str,
    tabla_afectada: str,
    id_registro_afectado: int | None = None,
    detalle: str | None = None
):
    registro = Auditoria(
        id_usuario=id_usuario,
        accion=accion,
        tabla_afectada=tabla_afectada,
        id_registro_afectado=id_registro_afectado,
        detalle=detalle
    )
    db.add(registro)
    db.commit()

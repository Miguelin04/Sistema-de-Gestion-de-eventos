import uuid
import os
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Inicializamos el cliente de MinIO usando las variables del docker-compose
minio_client = Minio(
    settings.MINIO_SERVER,       # Ej: "minio:9000" (nombre del servicio en Docker)
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=False                 # Estamos en red interna HTTP, no HTTPS
)

def subir_imagen_minio(file: UploadFile) -> str:
    """
    Toma el archivo validado, le asigna un UUID y lo empuja al bucket de MinIO.
    Retorna la URL pública generada para ser guardada en PostgreSQL.
    """
    try:
        # 1. Asegurar que el bucket exista y sea público
        try:
            if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
                import json
                minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
                # Política pública para permitir al frontend cargar la imagen
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET_NAME}/*"]
                        }
                    ]
                }
                minio_client.set_bucket_policy(settings.MINIO_BUCKET_NAME, json.dumps(policy))
        except Exception as bucket_err:
            print(f"[MinIO WARNING] No se pudo verificar o crear el bucket '{settings.MINIO_BUCKET_NAME}': {bucket_err}")
            # Continuamos por si el bucket ya existía pero hubo restricción de permisos al verificar

        # 2. Reiniciar el cursor de lectura (Vital para la integración con la HU_05)
        file.file.seek(0)
        
        # 3. Generamos un nombre único (UUID + extensión original)
        extension = os.path.splitext(file.filename)[1]
        nombre_unico = f"{uuid.uuid4()}{extension}"
        
        # 4. Subimos el objeto a MinIO
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET_NAME,  # Ej: "unl-eventos-media"
            object_name=nombre_unico,
            data=file.file,
            length=file.size,
            content_type=file.content_type
        )
        
        # 5. Construimos la URL pública (Puerto 9005 expuesto para el Frontend)
        url_publica = f"http://localhost:9005/{settings.MINIO_BUCKET_NAME}/{nombre_unico}"
        
        return url_publica

    except S3Error as e:
        print(f"[MinIO ERROR] Fallo en el almacenamiento de objetos: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"El servicio de almacenamiento de imagenes no está disponible actualmente: {str(e)}"
        )
    except Exception as e:
        print(f"[SISTEMA ERROR] Fallo interno al procesar el archivo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error inesperado al subir la imagen: {str(e)}"
        )
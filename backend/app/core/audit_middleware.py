import time
import json
import socket
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# ──────────────────────────────────────────────────────────────────────────────
# Inicialización LAZY del Producer de Kafka.
# El Producer se crea una sola vez, la primera vez que se necesita.
# Esto evita que un broker Kafka inaccesible bloquee el arranque del backend.
# ──────────────────────────────────────────────────────────────────────────────
_kafka_producer = None

def _get_kafka_producer():
    global _kafka_producer
    if _kafka_producer is not None:
        return _kafka_producer
    try:
        from confluent_kafka import Producer
        conf = {
            'bootstrap.servers': '3.21.50.248:9092',
            'client.id': socket.gethostname(),
            # Timeout corto para no bloquear requests si Kafka cae
            'socket.timeout.ms': 3000,
            'message.timeout.ms': 3000,
        }
        _kafka_producer = Producer(conf)
        print("[Kafka] Producer inicializado correctamente.")
    except Exception as e:
        print(f"[Kafka WARNING] No se pudo inicializar el Producer: {e}. La auditoría Kafka estará deshabilitada.")
        _kafka_producer = None
    return _kafka_producer


def delivery_report(err, msg):
    if err is not None:
        print(f"[Kafka] Entrega fallida: {err}")
    else:
        print(f"[Kafka] Mensaje entregado a {msg.topic()} [{msg.partition()}]")


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Procesar la petición normalmente (NUNCA bloquear por Kafka)
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        # Solo auditar mutaciones de datos exitosas
        if request.method in ["POST", "PUT", "DELETE"] and response.status_code < 400:

            actor = "Anonimo"
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                actor = "Usuario_JWT"

            event_data = {
                "actor": actor,
                "origen_evento": "GCP_Eventos",
                "metodo": request.method,
                "ruta": request.url.path,
                "tiempo_ms": round(process_time, 2),
                "payload": "Mutacion_de_datos"
            }

            # Intento de envío a Kafka — si falla, el request ya fue respondido
            try:
                producer = _get_kafka_producer()
                if producer:
                    producer.produce(
                        'auditoria',
                        value=json.dumps(event_data).encode('utf-8'),
                        callback=delivery_report
                    )
                    producer.poll(0)
            except Exception as e:
                print(f"[Kafka ERROR] No se pudo enviar evento de auditoría: {e}")

        return response


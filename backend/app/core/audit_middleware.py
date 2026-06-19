import time
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from confluent_kafka import Producer
import socket

# Configuración básica de Kafka (IP Pública de AWS para que GCP se conecte)
conf = {
    'bootstrap.servers': '18.225.179.237:9092',
    'client.id': socket.gethostname()
}
producer = Producer(conf)

def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Leer body (si aplica)
        body = b""
        if request.method in ["POST", "PUT", "DELETE"]:
            # FastAPI requiere consumir el stream y recrearlo
            body = await request.body()
            
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive

        # Procesar petición
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        # Si fue una mutación de datos (y la respuesta fue exitosa)
        if request.method in ["POST", "PUT", "DELETE"] and response.status_code < 400:
            
            # Obtener el Actor (Usuario) desde el token JWT (si existe)
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
                "payload": body.decode("utf-8") if body else ""
            }

            # Enviar mensaje a Kafka al tópico 'auditoria'
            try:
                producer.produce(
                    'auditoria', 
                    value=json.dumps(event_data).encode('utf-8'),
                    callback=delivery_report
                )
                producer.poll(0)
            except Exception as e:
                print(f"Error enviando a Kafka: {e}")

        return response

from app import app
from waitress import serve
import os

if __name__ == "__main__":
    # Obtener puerto desde la variable de entorno o usar 5000 por defecto
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Servidor WSGI de producción (Waitress) iniciado en http://127.0.0.1:{port}")
    
    # Iniciar servidor WSGI optimizado para producción
    serve(app, host="127.0.0.1", port=port)

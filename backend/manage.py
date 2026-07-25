import os
import sys

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app import app
except ImportError:
    from backend.app import app

from waitress import serve

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Servidor WSGI de producción (Waitress) iniciado en http://0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port)

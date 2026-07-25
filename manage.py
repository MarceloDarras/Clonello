import os
import sys

# Agregar la carpeta backend al path de Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from backend.app import app
except ImportError:
    from app import app

from waitress import serve

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Servidor WSGI de producción (Waitress) iniciado en http://0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port)

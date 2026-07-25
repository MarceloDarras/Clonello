import os
import sys

# Redirigir execution si Railway intenta ejecutar python manage.py por defecto
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from backend.app import app
except ImportError:
    from app import app

from waitress import serve

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Iniciando Servidor desde manage.py puente en http://0.0.0.0:{port}")
    serve(app, host="0.0.0.0", port=port)

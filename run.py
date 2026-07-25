import os
import sys

# Asegurar path de importación para backend
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')

if os.path.exists(backend_dir):
    sys.path.insert(0, backend_dir)
sys.path.insert(0, base_dir)

try:
    from backend.app import app
except ImportError:
    from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 [Railway WSGI Production] Servidor iniciando en 0.0.0.0:{port}...")
    
    try:
        from gunicorn.app.base import BaseApplication

        class StandaloneApplication(BaseApplication):
            def __init__(self, app_instance, options=None):
                self.options = options or {}
                self.application = app_instance
                super().__init__()

            def load_config(self):
                for key, value in self.options.items():
                    if key in self.cfg.settings and value is not None:
                        self.cfg.set(key.lower(), value)

            def load(self):
                return self.application

        options = {
            'bind': f'0.0.0.0:{port}',
            'workers': 2,
            'timeout': 120,
        }
        StandaloneApplication(app, options).run()
    except Exception as err:
        print(f"Usando Waitress WSGI como fallback: {err}")
        from waitress import serve
        serve(app, host="0.0.0.0", port=port)

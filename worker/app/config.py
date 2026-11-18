import json
import os
from dotenv import load_dotenv

load_dotenv(override=False)

class Settings:
    def __init__(self):
        # Base de datos
        self.POSTGRES_DB: str = os.getenv("POSTGRES_DB", "news_monitor")
        self.POSTGRES_USER: str = os.getenv("POSTGRES_USER", "rcg")
        self.POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
        self.POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
        self.POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
        
        # Seguridad y APIs
        self.INTERNAL_WEBHOOK_SECRET: str = os.getenv("INTERNAL_WEBHOOK_SECRET", "")
        self.GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
        self.GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini-3.5-flash-lite")
        self.BACKEND_INTERNAL_URL: str = os.getenv("BACKEND_INTERNAL_URL", "http://localhost:4000/api/internal/notify")
        
        # Conversión de tipos (ej: string del env a entero)
        poll_interval_raw = os.getenv("POLL_INTERVAL_SECONDS", "600")
        try:
            self.POLL_INTERVAL_SECONDS: int = int(poll_interval_raw)
        except ValueError:
            self.POLL_INTERVAL_SECONDS = 300

    def validate(self):
        """Valida que las variables críticas no estén vacías al arrancar."""
        missing = []
        if not self.GOOGLE_API_KEY:
            missing.append("GOOGLE_API_KEY")
        if not self.POSTGRES_PASSWORD:
            missing.append("POSTGRES_PASSWORD")
            
        if missing:
            raise ValueError(f"Faltan las siguientes variables de entorno obligatorias: {', '.join(missing)}")

    def log_settings(self):
        """Imprime las configuraciones actuales (útil para debugging)."""
        config = {
            "POSTGRES_DB": self.POSTGRES_DB,
            "POSTGRES_USER": self.POSTGRES_USER,
            "POSTGRES_HOST": self.POSTGRES_HOST,
            "POSTGRES_PORT": self.POSTGRES_PORT,
            "POLL_INTERVAL_SECONDS": self.POLL_INTERVAL_SECONDS,
            "GOOGLE_MODEL": self.GOOGLE_MODEL,
            "INTERNAL_WEBHOOK_SECRET_CONFIGURED": bool(self.INTERNAL_WEBHOOK_SECRET),
            "GOOGLE_API_KEY_CONFIGURED": bool(self.GOOGLE_API_KEY),
            "POSTGRES_PASSWORD_CONFIGURED": bool(self.POSTGRES_PASSWORD),
        }
        print("Configuraciones actuales:")
        print(json.dumps(config, indent=2))

# Instancia global única (Singleton) para importar en todo el proyecto
settings = Settings()

if __name__ == "__main__":
    settings.log_settings()
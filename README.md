
# News AI Monitor

## Inicio
```bash
cp .env.example .env
# Añade GOOGLE_API_KEY a .env para activar Gemini
docker compose up --build
```
Frontend: http://localhost:3000 · API/SSE: http://localhost:4000 · PostgreSQL: localhost:5432

## API
- `GET /api/health`
- `GET /api/articles`
- `GET /api/events` (SSE)
- `POST /api/internal/notify` (webhook privado con `x-internal-secret`)

Añade feeds RSS insertando filas en `feeds`. El worker consulta los feeds activos cada `POLL_INTERVAL_SECONDS`, persiste artículos, genera resúmenes si hay clave Gemini y notifica al backend.

Hot-reload: Next dev, Nodemon (`--legacy-watch`) y Watchfiles para Python. Los volúmenes nombrados preservan `node_modules` y `.next`.

El SQL de `database/init` se ejecuta solo al crear un volumen PostgreSQL vacío. `docker compose down -v` elimina también los datos. Antes de producción, cambia secretos, añade TLS y autenticación, migraciones versionadas, límites y observabilidad.


python -m app.main

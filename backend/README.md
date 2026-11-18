# News API Backend

Backend Express + PostgreSQL para gestionar feeds, artículos y resúmenes.

## Requisitos

- Node.js 18 o superior
- PostgreSQL

## Instalación

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y configura `DATABASE_URL`, `PORT` y `CORS_ORIGIN`.

3. Crea las tablas ejecutando `database/schema.sql` en tu base de datos PostgreSQL.

4. Arranca el servidor:

   ```bash
   npm run dev
   ```

La API estará disponible por defecto en `http://localhost:4000`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API y PostgreSQL |
| GET | `/api/articles?limit=50` | Listar artículos |
| GET | `/api/articles/:id` | Obtener artículo |
| POST | `/api/articles` | Crear artículo |
| DELETE | `/api/articles/:id` | Eliminar artículo |
| GET | `/api/feeds` | Listar feeds |
| GET | `/api/feeds/:id` | Obtener feed |
| POST | `/api/feeds` | Crear feed |
| PUT | `/api/feeds/:id` | Actualizar feed |
| DELETE | `/api/feeds/:id` | Eliminar feed |
| GET | `/api/summaries` | Listar resúmenes |
| GET | `/api/summaries/:articleId` | Obtener resumen por artículo |
| PUT | `/api/summaries/:articleId` | Crear o actualizar resumen |
| DELETE | `/api/summaries/:articleId` | Eliminar resumen |

## Ejemplos de peticiones

Crear un feed:

```bash
curl -X POST http://localhost:4000/api/feeds \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Hacker News","url":"https://hnrss.org/frontpage"}'
```

Crear un artículo:

```bash
curl -X POST http://localhost:4000/api/articles \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Mi noticia","url":"https://example.com/noticia"}'
```

Guardar un resumen:

```bash
curl -X PUT http://localhost:4000/api/summaries/1 \\
  -H "Content-Type: application/json" \\
  -d '{"model":"modelo-ejemplo","summary":"Resumen de la noticia."}'
```

## Estructura

- `routes/`: endpoints HTTP y validaciones básicas.
- `services/`: consultas SQL y lógica de acceso a datos.
- `database/schema.sql`: esquema inicial de PostgreSQL.
- `db.js`: pool de conexiones PostgreSQL.
- `server.js`: configuración y arranque de Express.

Nota: la importación automática RSS y la generación de resúmenes mediante IA todavía no están implementadas; este proyecto contiene la API CRUD para feeds, artículos y resúmenes.

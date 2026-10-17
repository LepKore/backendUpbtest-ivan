# Contexto del proyecto

> Última verificación: 2026-10-17

## 1. Propósito del proyecto
API REST para gestionar el catálogo de productos y registrar los pedidos del frontend.
Audiencia / uso: proyecto académico.

## 2. Stack tecnológico y arquitectura
Backend: Node.js, Express 5 y PostgreSQL mediante `pg`.
Tests: runner nativo `node:test` con `supertest` para las rutas (74 casos).
Patrones clave: rutas, middleware de autenticación, controladores, servicio, repositorio, DTO y entidad.

## 3. Estructura del proyecto
/src/app.js: configuración HTTP; exporta `app` e `inicializarBaseDeDatos`, y solo escucha si se ejecuta directamente.
/src/config: pool PostgreSQL.
/src/db: `schema.sql`, `init.js`, `seed.js` (`sembrar(client)`: carta de 3 platos reales + pedido de ejemplo, usado por el arranque y el reseteo) y `migraciones.js` (migraciones idempotentes para bases ya existentes).
/src/middleware/auth.js: login y protección de escrituras.
/src/routes, /src/controllers, /src/services, /src/repositories: CRUD de productos y de pedidos (`/api/pedidos`).
/src/dtos, /src/entities, /src/utils: contratos, entidad y errores HTTP.
/tests/: un archivo por módulo (dto, entidad, servicio, repositorio, auth, rutas, seed, reset, migraciones).
/hooks/verificar-tests-antes-de-push.ts: hook de OpenCode que bloquea `git push` si `npm test` falla; se registra en `opencode.jsonc`.
Nota para IA: no hay rutas declaradas como no modificables.

## 4. Comandos críticos
Inicialización: `npm install`.
Desarrollo: `npm run dev`.
Producción: `npm start`.
Tests: `npm test`.
Testing adicional: CI verifica sintaxis con `node --check`.
Deploy: push a `main` dispara el deploy en Render tras pasar los tests (requiere confirmación).

## 5. Reglas y convenciones estrictas
JavaScript CommonJS; nombres y mensajes en español.
Errores HTTP mediante `HttpError` y middleware global.
Variables requeridas: `PORT`, `DATABASE_URL`, `DB_SSL`, `ADMIN_USER`, `ADMIN_PASSWORD` y `AUTH_SECRET`. Las tres últimas y `DATABASE_URL` son obligatorias: si falta alguna, `src/middleware/auth.js` o `src/config/db.js` lanzan al cargar y el servidor no arranca. No reintroducir valores por defecto en el código.
`DB_PORT` no es necesario porque `DATABASE_URL` ya contiene el puerto.
Comparar firmas con hashes de longitud fija: comparar cadenas crudas puede lanzar `RangeError`.
Los tests sustituyen `pool` y el repositorio en `require.cache`; no deben tocar la base real.
Crear un pedido descuenta stock en una transacción: si un producto no tiene stock, se hace `ROLLBACK` y se responde 409.
Los totales se redondean a céntimos para evitar errores de coma flotante.
Las credenciales académicas están documentadas en README; cambiar en entornos reales.
`POST /api/admin/reset` es destructivo e irreversible: solo con token de administrador y nunca disparado desde el frontend. Afecta a la base de datos a la que apunte `DATABASE_URL`.
`pedido_items.producto_id` es nullable y `ON DELETE SET NULL`: los cambios de clave foránea van en `src/db/migrations.js`, nunca editando solo `schema.sql` (las bases existentes ya están creadas).
El seed vive solo en `src/db/seed.js`; el arranque y el reseteo llaman a `sembrar(client)`.

## 6. Estado actual y registro de cambios
Completado: API CRUD de productos y de pedidos (crear con descuento de stock, historial, cancelar con reposición), autenticación académica, seed idempotente con 3 platos reales y un pedido de ejemplo, endpoint protegido `POST /api/admin/reset` para devolver la base de datos a su estado inicial, `ON DELETE SET NULL` en `pedido_items` para poder borrar productos con historial, 85 tests, auditoría de secretos (sin fugas: `.env` ignorado y nunca versionado) y endurecimiento de las variables de autenticación, hook anti-push y workflow con tests.
En progreso: configurar variables reales en Render.
Problemas conocidos: PostgreSQL debe estar disponible y correctamente configurado.
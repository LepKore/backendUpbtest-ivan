# Contexto del proyecto

> Última verificación: 2026-10-16

## 1. Propósito del proyecto
API REST para gestionar productos.
Audiencia / uso: TODO (no deducible del código).

## 2. Stack tecnológico y arquitectura
Frontend: N/A.
Backend: Node.js con Express y PostgreSQL mediante `pg`.
Patrones clave: rutas, controladores, servicio, repositorio, DTO y entidad.

## 3. Estructura del proyecto (mapeo)
/src/app.js: configuración y arranque HTTP.
/src/config: configuración del pool de PostgreSQL.
/src/db: script de inicialización y esquema SQL.
/src/routes, /src/controllers, /src/services, /src/repositories: capas de productos.
/src/dtos, /src/entities, /src/utils: contratos, entidad y errores HTTP.
Nota para IA: no hay rutas declaradas como no modificables en el repositorio.

## 4. Comandos críticos
Inicialización: `npm install`.
Desarrollo: `npm run dev`.
Testing: TODO (no hay script de tests configurado).
Lint / typecheck: TODO (no configurados).
Deploy: `npm start` (informativo; requiere confirmación).

## 5. Reglas y convenciones estrictas
Estilo de código: JavaScript CommonJS; nombres y mensajes en español.
Librerías permitidas / prohibidas: TODO (no deducible del código).
Manejo de errores: `HttpError` para errores HTTP; middleware global en `src/app.js`.

## 6. Estado actual y registro de cambios
Completado: API CRUD de productos implementada.
En progreso: TODO.
Problemas conocidos: la tabla `productos` no existe en la base de datos verificada.

# Colección de Postman

Archivo: `ratatouille-api.postman_collection.json` (formato v2.1.0).

**No hay environment**, tal como se pidió: todas las variables viven dentro de la propia colección.

## Importar

Postman → **Import** → **File** → selecciona `ratatouille-api.postman_collection.json`.

## Variables de la colección

| Variable | Valor inicial | Para qué sirve |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | Dirección del backend. Cámbiala en *Collection → Variables* si usas el despliegue de Render. |
| `token` | *(vacía)* | Se relloha sola al ejecutar **Auth → Login**. |
| `productoId` | `1` | Se actualiza al ejecutar *Listar productos* o *Crear producto*. |
| `pedidoId` | `1` | Se actualiza al ejecutar *Listar pedidos* o *Crear pedido*. |

## Orden recomendado

1. **Auth → Login** con las credenciales del `.env` (`ADMIN_USER` / `ADMIN_PASSWORD`).
2. El resto de peticiones que escriben datos ya llevan `Authorization: Bearer {{token}}`.

Los scripts de test de varias peticiones guardan ids en variables para que no tengas que copiarlos a mano.

## Contenido

| Carpeta | Peticiones |
|---|---|
| Salud | `GET /`, `GET /health`, `GET /health/db` |
| Auth | `POST /api/auth/login` (guarda el token) |
| Productos | listar, obtener, crear, actualizar, eliminar |
| Pedidos | listar (historial), obtener, crear, cancelar |
| Administración | `POST /api/admin/reset` |
| Errores | 404 ruta inexistente, 401 sin token, 400 cuerpo inválido, 409 sin stock |

**Aviso**: *Resetear la base de datos* es irreversible. Afecta a la base de datos a la que apunte `baseUrl`; comprueba la URL antes de ejecutarlo.
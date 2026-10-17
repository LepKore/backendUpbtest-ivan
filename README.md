# Backend de productos y pedidos

API Express + PostgreSQL para el catálogo y los pedidos del frontend.

## Variables

Configura `DATABASE_URL`, `DB_SSL`, `ADMIN_USER`, `ADMIN_PASSWORD` y `AUTH_SECRET` en Render o en `.env`.

Las tres últimas son **obligatorias**: si falta alguna, el servidor no arranca y muestra cuál falta. No hay valores por defecto en el código, precisamente para que un despliegue sin configurar no quede con un administrador abierto.

Credenciales de administración para este proyecto académico: **`admin` / `admin123`**. Se dejan a propósito para que cualquiera pueda probar la pantalla de administración; cámbialas en cualquier entorno real.

Genera un `AUTH_SECRET` con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Al arrancar, el servidor crea las tablas `productos`, `pedidos` y `pedido_items`, aplica las migraciones pendientes y, si la base está vacía, inserta la carta inicial (`Ratatouille` 13,50 €, `Sopa de cebolla a la francesa` 9,50 € y `Pollo al vino tinto (Coq au Vin)` 16,90 €) más un pedido de ejemplo de "Marta Ejemplo".

`pedido_items` guarda el nombre y el precio congelados, y su `producto_id` es `ON DELETE SET NULL`: un producto que aparece en el historial se puede borrar de la carta sin perder los pedidos.

## API

- `GET /health` y `GET /health/db`
- `GET /api/productos` (público)
- `POST|PUT|DELETE /api/productos[/:id]` requieren `Authorization: Bearer <token>`
- `GET /api/pedidos` (historial, público) y `GET /api/pedidos/:id`
- `POST /api/pedidos` (público): cuerpo `{ cliente, telefono?, notas?, items: [{ productoId, cantidad }] }`.
  Los nombres y precios se toman siempre del producto guardado en la base de datos, se descuenta el stock y se guarda el pedido en una transacción. Si falta stock responde `409`.
- `POST /api/pedidos/:id/cancelar` requiere token: marca el pedido como `cancelado` y devuelve el stock al catálogo.
- `POST /api/admin/reset` requiere token de administrador: **borra todos los datos** (productos, pedidos e items), reinicia los contadores de `id` y vuelve a insertar la carta inicial y el pedido de ejemplo, dejando la base de datos como recién desplegada. Úsalo con cuidado: es irreversible.

Para usarlo, obtén un token y llama al reseteo:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","password":"admin123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -X POST http://localhost:3000/api/admin/reset -H "Authorization: Bearer $TOKEN"
# {"mensaje":"Base de datos reiniciada","productos":3,"pedido":true}
```

Antes de invocarlo, comprueba que `DATABASE_URL` apunta a la base de datos correcta: el reseteo afecta a la base de datos a la que se conecte el servidor.

`npm run dev` inicia desarrollo, `npm start` producción y `npm test` ejecuta los tests.
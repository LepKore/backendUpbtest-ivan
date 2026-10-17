// Carta inicial del restaurante y un pedido de ejemplo.
// Se insertan solo cuando las tablas están vacías (primer arranque o reseteo).

const PRODUCTOS_SEED = [
    { nombre: 'Ratatouille', precio: 13.5, stock: 20 },
    { nombre: 'Sopa de cebolla a la francesa', precio: 9.5, stock: 30 },
    { nombre: 'Pollo al vino tinto (Coq au Vin)', precio: 16.9, stock: 12 },
];

const PEDIDO_SEED = {
    cliente: 'Marta Ejemplo',
    telefono: '600 123 456',
    notas: 'Pedido de ejemplo creado al inicializar la base de datos.',
    items: [
        { nombre: 'Ratatouille', cantidad: 2 },
        { nombre: 'Sopa de cebolla a la francesa', cantidad: 1 },
    ],
};

const redondear = (valor) => Math.round(valor * 100) / 100;

// Inserta la carta y el pedido de ejemplo solo si estan vacios.
// Recibe un cliente de pg porque el pedido necesita los ids de sus productos.
const sembrar = async (client) => {
    let productos = await client.query('SELECT id, nombre, precio FROM productos ORDER BY id');
    if (productos.rows.length === 0) {
        for (const producto of PRODUCTOS_SEED) {
            await client.query('INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3)', [producto.nombre, producto.precio, producto.stock]);
        }
        productos = await client.query('SELECT id, nombre, precio FROM productos ORDER BY id');
    }

    const pedidos = await client.query('SELECT COUNT(*)::int AS total FROM pedidos');
    let pedidoCreado = false;
    if (pedidos.rows[0].total === 0) {
        const items = PEDIDO_SEED.items
            .map((item) => {
                const producto = productos.rows.find((p) => p.nombre === item.nombre);
                return producto ? { ...producto, cantidad: item.cantidad } : null;
            })
            .filter(Boolean);

        if (items.length > 0) {
            const total = redondear(items.reduce((suma, i) => suma + Number(i.precio) * i.cantidad, 0));
            const pedido = await client.query(
                'INSERT INTO pedidos (cliente, telefono, notas, total) VALUES ($1, $2, $3, $4) RETURNING id',
                [PEDIDO_SEED.cliente, PEDIDO_SEED.telefono, PEDIDO_SEED.notas, total]
            );
            for (const item of items) {
                await client.query('INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES ($1, $2, $3, $4, $5)', [
                    pedido.rows[0].id,
                    item.id,
                    item.nombre,
                    item.precio,
                    item.cantidad,
                ]);
            }
            pedidoCreado = true;
        }
    }

    return { productos: PRODUCTOS_SEED.length, pedido: pedidoCreado };
};

module.exports = { PRODUCTOS_SEED, PEDIDO_SEED, sembrar };
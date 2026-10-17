const pool = require('../config/db');
const HttpError = require('../utils/http-error');

const mapearPedido = (row, items) => ({
    id: row.id,
    cliente: row.cliente,
    telefono: row.telefono,
    notas: row.notas,
    estado: row.estado,
    total: Number(row.total),
    createdAt: row.created_at,
    items,
});

const mapearItem = (row) => ({
    productoId: row.producto_id,
    nombre: row.nombre,
    precio: Number(row.precio),
    cantidad: row.cantidad,
    subtotal: Number(row.precio) * row.cantidad,
});

const itemsDe = async (client, pedidoId) => {
    const { rows } = await client.query('SELECT * FROM pedido_items WHERE pedido_id = $1 ORDER BY id', [pedidoId]);
    return rows.map(mapearItem);
};

const findAll = async () => {
    const { rows: pedidos } = await pool.query('SELECT * FROM pedidos ORDER BY created_at DESC, id DESC');
    if (pedidos.length === 0) return [];
    const ids = pedidos.map((p) => p.id);
    const { rows: items } = await pool.query('SELECT * FROM pedido_items WHERE pedido_id = ANY($1::int[]) ORDER BY id', [ids]);
    return pedidos.map((pedido) => mapearPedido(pedido, items.filter((i) => i.pedido_id === pedido.id).map(mapearItem)));
};

const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const client = await pool.connect();
    try {
        return mapearPedido(rows[0], await itemsDe(client, rows[0].id));
    } finally {
        client.release();
    }
};

// Crea el pedido y descuenta el stock en una sola transicion: si un producto se queda
// sin stock, se deshace todo (rollback) y se avisa con 409.
const create = async ({ cliente, telefono, notas, items }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const item of items) {
            const { rowCount } = await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
                [item.cantidad, item.productoId]
            );
            if (rowCount === 0) throw new HttpError(409, `No hay stock suficiente de "${item.nombre}"`);
        }
        // se redondea a centimos para evitar errores de coma flotante (12.34 * 3 = 37.019999...)
        const total = Math.round(items.reduce((suma, item) => suma + Number(item.precio) * item.cantidad, 0) * 100) / 100;
        const { rows: pedidos } = await client.query(
            'INSERT INTO pedidos (cliente, telefono, notas, total) VALUES ($1, $2, $3, $4) RETURNING *',
            [cliente, telefono ?? null, notas ?? null, total]
        );
        const pedido = pedidos[0];
        for (const item of items) {
            await client.query(
                'INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES ($1, $2, $3, $4, $5)',
                [pedido.id, item.productoId, item.nombre, item.precio, item.cantidad]
            );
        }
        await client.query('COMMIT');
        return mapearPedido({ ...pedido, total }, items.map((item) => ({ ...item, subtotal: Math.round(Number(item.precio) * item.cantidad * 100) / 100 })));
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Cancela el pedido y devuelve el stock de sus productos al catalogo
const cancelar = async (id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            "UPDATE pedidos SET estado = 'cancelado' WHERE id = $1 AND estado = 'confirmado' RETURNING *",
            [id]
        );
        if (rows.length === 0) throw new HttpError(404, 'Pedido no encontrado o ya cancelado');
        const pedido = rows[0];
        await client.query(
            'UPDATE productos SET stock = stock + pedido_items.cantidad FROM pedido_items WHERE pedido_items.pedido_id = $1',
            [id]
        );
        await client.query('COMMIT');
        return mapearPedido(pedido, await itemsDe(client, id));
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { findAll, findById, create, cancelar };
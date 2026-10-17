const test = require('node:test');
const assert = require('node:assert/strict');

const poolPath = require.resolve('../src/config/db');

// Cliente falso con almacen en memoria: permite observar el seed sin tocar la base real
const consultas = [];
let productos = [];
let pedidos = [];
let siguienteProducto = 1;
let siguientePedido = 1;

const ejecutar = async (sql, params = []) => {
    consultas.push(sql);
    if (sql.includes('SELECT id, nombre, precio FROM productos')) return { rows: productos };
    if (sql.includes('COUNT(*)::int AS total FROM pedidos')) return { rows: [{ total: pedidos.length }] };
    if (sql.startsWith('INSERT INTO productos')) {
        const [nombre, precio, stock] = params;
        const nuevo = { id: siguienteProducto++, nombre, precio: Number(precio), stock };
        productos.push(nuevo);
        return { rows: [nuevo] };
    }
    if (sql.startsWith('INSERT INTO pedidos')) {
        const nuevo = { id: siguientePedido++, cliente: params[0] };
        pedidos.push(nuevo);
        return { rows: [nuevo] };
    }
    if (sql.startsWith('INSERT INTO pedido_items')) pedidos[pedidos.length - 1].items = (pedidos[pedidos.length - 1].items || []).concat([params]);
    return { rows: [] };
};

require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: {
        query: async (sql, params) => {
            consultas.push(sql);
            return { rows: [] };
        },
        connect: async () => ({ query: ejecutar, release: () => {} }),
        end: async () => {},
    },
};

const { inicializarBaseDeDatos } = require('../src/app');
const { PRODUCTOS_SEED, PEDIDO_SEED } = require('../src/db/seed');

const reiniciarAlmacenes = () => {
    consultas.length = 0;
    productos = [];
    pedidos = [];
    siguienteProducto = 1;
    siguientePedido = 1;
};

test('seed - crea el esquema, aplica migraciones e inserta la carta cuando la tabla está vacía', async () => {
    reiniciarAlmacenes();
    await inicializarBaseDeDatos();
    assert.match(consultas[0], /CREATE TABLE IF NOT EXISTS productos/);
    assert.ok(consultas.some((sql) => sql.includes('DROP CONSTRAINT IF EXISTS pedido_items_producto_id_fkey')));
    assert.equal(productos.length, 3);
    assert.deepEqual(productos.map((p) => p.nombre), PRODUCTOS_SEED.map((p) => p.nombre));
    assert.ok(productos.some((p) => p.nombre === 'Ratatouille'), 'el seed debe incluir Ratatouille');
    assert.equal(productos.length, 3, 'el seed debe contener exactamente 3 platos');
});

test('seed - crea un pedido de ejemplo con los platos reales', async () => {
    assert.equal(pedidos.length, 1);
    assert.equal(pedidos[0].cliente, PEDIDO_SEED.cliente);
    assert.deepEqual(pedidos[0].items.map((i) => i[2]), ['Ratatouille', 'Sopa de cebolla a la francesa']);
});

test('seed - no inserta duplicados si ya hay productos y pedidos', async () => {
    const productosAntes = productos.length;
    const pedidosAntes = pedidos.length;
    consultas.length = 0;
    await inicializarBaseDeDatos();
    assert.equal(productos.length, productosAntes);
    assert.equal(pedidos.length, pedidosAntes);
    assert.equal(consultas.filter((sql) => sql.startsWith('INSERT')).length, 0);
});
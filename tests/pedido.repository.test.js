const test = require('node:test');
const assert = require('node:assert/strict');

// Pool falso: cada consulta devuelve lo que indique "respuestas" en orden
const poolPath = require.resolve('../src/config/db');
const consultas = [];
let respuestas = [];
const esControl = (sql) => /^\s*(BEGIN|COMMIT|ROLLBACK)\s*$/.test(sql);
let filaActual = () => ({ rows: [], rowCount: 0 });
const responder = (sql) => (/SELECT/.test(sql) || /UPDATE|INSERT/.test(sql) ? respuestas.shift() || { rows: [], rowCount: 0 } : filaActual());
require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: {
        query: async (sql, params) => {
            consultas.push({ sql, params });
            return responder(sql);
        },
        connect: async () => ({
            query: async (sql, params) => {
                consultas.push({ sql, params });
                return esControl(sql) ? { rows: [], rowCount: 0 } : responder(sql);
            },
            release: () => {},
        }),
        end: async () => {},
    },
};

const repositorio = require('../src/repositories/pedido.repository');

const reiniciar = () => {
    consultas.length = 0;
    respuestas = [];
};

test('pedido.repository - findAll devuelve el historial con sus items', async () => {
    reiniciar();
    respuestas = [
        { rows: [{ id: 2, cliente: 'Ana', telefono: null, notas: null, estado: 'confirmado', total: '15.00', created_at: 'hoy' }], rowCount: 1 },
        { rows: [{ id: 7, pedido_id: 2, producto_id: 1, nombre: 'Paella', precio: '7.50', cantidad: 2 }], rowCount: 1 },
    ];
    const pedidos = await repositorio.findAll();
    assert.match(consultas[0].sql, /ORDER BY created_at DESC/);
    assert.equal(pedidos[0].total, 15);
    assert.deepEqual(pedidos[0].items[0], { productoId: 1, nombre: 'Paella', precio: 7.5, cantidad: 2, subtotal: 15 });
});

test('pedido.repository - findById devuelve null si no existe', async () => {
    reiniciar();
    respuestas = [{ rows: [], rowCount: 0 }];
    assert.equal(await repositorio.findById(404), null);
});

test('pedido.repository - create descuenta stock e inserta el pedido en una transaccion', async () => {
    reiniciar();
    respuestas = [
        { rows: [], rowCount: 1 }, // UPDATE stock del producto 1
        { rows: [], rowCount: 1 }, // UPDATE stock del producto 2
        { rows: [{ id: 3, cliente: 'Ana', telefono: null, notas: null, estado: 'confirmado', total: '25.00', created_at: 'hoy' }], rowCount: 1 },
        { rows: [], rowCount: 1 }, // INSERT item 1
        { rows: [], rowCount: 1 }, // INSERT item 2
    ];
    const pedido = await repositorio.create({
        cliente: 'Ana',
        telefono: null,
        notas: null,
        items: [
            { productoId: 1, nombre: 'Paella', precio: 10, cantidad: 2 },
            { productoId: 2, nombre: 'Tarta', precio: 5, cantidad: 1 },
        ],
    });
    assert.match(consultas[0].sql, /BEGIN/);
    assert.match(consultas[1].sql, /UPDATE productos SET stock = stock - \$1/);
    assert.deepEqual(consultas[1].params, [2, 1]);
    assert.match(consultas.at(-1).sql, /COMMIT/);
    assert.equal(pedido.total, 25);
    assert.equal(pedido.items.length, 2);
});

test('pedido.repository - create revierte todo si falta stock', async () => {
    reiniciar();
    respuestas = [{ rows: [], rowCount: 0 }]; // el UPDATE de stock no afecta filas
    await assert.rejects(
        () => repositorio.create({ cliente: 'Ana', items: [{ productoId: 1, nombre: 'Paella', precio: 10, cantidad: 5 }] }),
        (error) => error.status === 409
    );
    assert.match(consultas.at(-1).sql, /ROLLBACK/);
});

test('pedido.repository - create calcula el total a partir de los precios', async () => {
    reiniciar();
    respuestas = [
        { rows: [], rowCount: 1 },
        { rows: [{ id: 4, cliente: 'Ana', estado: 'confirmado', total: '0.00', created_at: 'hoy' }], rowCount: 1 },
    ];
    const pedido = await repositorio.create({
        cliente: 'Ana',
        items: [{ productoId: 1, nombre: 'Paella', precio: 12.34, cantidad: 3 }],
    });
    const insercion = consultas.find((c) => /INSERT INTO pedidos/.test(c.sql));
    assert.equal(Number(insercion.params[3]), 37.02);
    assert.equal(pedido.total, 37.02);
});

test('pedido.repository - cancelar repone el stock y marca el pedido', async () => {
    reiniciar();
    respuestas = [
        { rows: [{ id: 5, cliente: 'Ana', estado: 'cancelado', total: '10.00', created_at: 'hoy' }], rowCount: 1 },
        { rows: [{ id: 1, pedido_id: 5, producto_id: 1, nombre: 'Paella', precio: '10.00', cantidad: 1 }], rowCount: 1 },
    ];
    const pedido = await repositorio.cancelar(5);
    assert.ok(consultas.some((c) => /SET stock = stock \+ pedido_items.cantidad/.test(c.sql)));
    assert.equal(pedido.estado, 'cancelado');
});

test('pedido.repository - cancelar falla si el pedido no existe o ya estaba cancelado', async () => {
    reiniciar();
    respuestas = [{ rows: [], rowCount: 0 }];
    await assert.rejects(() => repositorio.cancelar(9), (error) => error.status === 404);
    assert.match(consultas.at(-1).sql, /ROLLBACK/);
});
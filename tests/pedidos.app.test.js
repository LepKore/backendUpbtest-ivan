const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.AUTH_SECRET = 'secreto-de-test';

// Almacenes en memoria: simulan productos y pedidos sin tocar la base de datos
let almacenProductos = [{ id: 1, nombre: 'Paella', precio: 10, stock: 5 }];
let almacenPedidos = [];

const productoRepoPath = require.resolve('../src/repositories/producto.repository');
require.cache[productoRepoPath] = {
    id: productoRepoPath,
    filename: productoRepoPath,
    loaded: true,
    exports: {
        findAll: async () => almacenProductos,
        findById: async (id) => almacenProductos.find((p) => p.id === id) || null,
        create: async (datos) => { const nuevo = { id: almacenProductos.length + 1, ...datos }; almacenProductos.push(nuevo); return nuevo; },
        update: async (id, datos) => { almacenProductos = almacenProductos.map((p) => (p.id === id ? { ...p, ...datos } : p)); return almacenProductos.find((p) => p.id === id); },
        remove: async (id) => { const antes = almacenProductos.length; almacenProductos = almacenProductos.filter((p) => p.id !== id); return almacenProductos.length < antes; },
    },
};

// El repositorio de pedidos se sustituye por uno en memoria que descuenta stock igual que el real
const pedidoRepoPath = require.resolve('../src/repositories/pedido.repository');
require.cache[pedidoRepoPath] = {
    id: pedidoRepoPath,
    filename: pedidoRepoPath,
    loaded: true,
    exports: {
        findAll: async () => almacenPedidos,
        findById: async (id) => almacenPedidos.find((p) => p.id === id) || null,
        create: async ({ cliente, telefono, notas, items }) => {
            for (const item of items) {
                const producto = almacenProductos.find((p) => p.id === item.productoId);
                if (!producto || producto.stock < item.cantidad) {
                    const error = new Error(`No hay stock suficiente de "${item.nombre ?? item.productoId}"`);
                    error.status = 409;
                    throw error;
                }
            }
            items.forEach((item) => { almacenProductos.find((p) => p.id === item.productoId).stock -= item.cantidad; });
            const pedido = {
                id: almacenPedidos.length + 1,
                cliente,
                telefono,
                notas,
                estado: 'confirmado',
                total: items.reduce((suma, i) => suma + Number(i.precio) * i.cantidad, 0),
                createdAt: new Date().toISOString(),
                items: items.map((i) => ({ ...i, subtotal: Number(i.precio) * i.cantidad })),
            };
            almacenPedidos.push(pedido);
            return pedido;
        },
        cancelar: async (id) => {
            const pedido = almacenPedidos.find((p) => p.id === id && p.estado === 'confirmado');
            if (!pedido) { const error = new Error('Pedido no encontrado o ya cancelado'); error.status = 404; throw error; }
            pedido.estado = 'cancelado';
            pedido.items.forEach((i) => { const producto = almacenProductos.find((p) => p.id === i.productoId); if (producto) producto.stock += i.cantidad; });
            return pedido;
        },
    },
};

const poolPath = require.resolve('../src/config/db');
require.cache[poolPath] = { id: poolPath, filename: poolPath, loaded: true, exports: { query: async () => ({ rows: [{ total: 1 }] }), end: async () => {} } };

const { app } = require('../src/app');

const tokenDePrueba = async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'admin123' });
    return res.body.token;
};

test('GET /api/pedidos devuelve el historial', async () => {
    const res = await request(app).get('/api/pedidos');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
});

test('POST /api/pedidos crea el pedido y descuenta el stock', async () => {
    almacenPedidos = [];
    almacenProductos = [{ id: 1, nombre: 'Paella', precio: 10, stock: 5 }];
    const res = await request(app).post('/api/pedidos').send({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 2 }] });
    assert.equal(res.status, 201);
    assert.equal(res.body.total, 20);
    assert.equal(res.body.items[0].nombre, 'Paella');
    assert.equal(almacenProductos[0].stock, 3);
});

test('POST /api/pedidos devuelve 409 si no hay stock', async () => {
    almacenPedidos = [];
    almacenProductos = [{ id: 1, nombre: 'Paella', precio: 10, stock: 1 }];
    const res = await request(app).post('/api/pedidos').send({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 9 }] });
    assert.equal(res.status, 409);
    assert.equal(almacenProductos[0].stock, 1);
});

test('POST /api/pedidos valida el cuerpo', async () => {
    const res = await request(app).post('/api/pedidos').send({ items: [] });
    assert.equal(res.status, 400);
});

test('GET /api/pedidos/:id devuelve 404 si no existe', async () => {
    const res = await request(app).get('/api/pedidos/999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Pedido no encontrado');
});

test('POST /api/pedidos/:id/cancelar exige token', async () => {
    const res = await request(app).post('/api/pedidos/1/cancelar').send({});
    assert.equal(res.status, 401);
});

test('POST /api/pedidos/:id/cancelar repone el stock con token válido', async () => {
    almacenPedidos = [];
    almacenProductos = [{ id: 1, nombre: 'Paella', precio: 10, stock: 5 }];
    await request(app).post('/api/pedidos').send({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 2 }] });
    assert.equal(almacenProductos[0].stock, 3);
    const token = await tokenDePrueba();
    const res = await request(app).post('/api/pedidos/1/cancelar').set('Authorization', `Bearer ${token}`).send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, 'cancelado');
    assert.equal(almacenProductos[0].stock, 5);
});
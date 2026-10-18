const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

require('./helpers/entorno');

// Se sustituyen repositorio y pool para probar las rutas sin base de datos
const repositorioPath = require.resolve('../src/repositories/producto.repository');
let almacen = [{ id: 1, nombre: 'Producto de ejemplo', precio: 10, stock: 20 }];
require.cache[repositorioPath] = {
    id: repositorioPath,
    filename: repositorioPath,
    loaded: true,
    exports: {
        findAll: async () => almacen,
        findById: async (id) => almacen.find((p) => p.id === id) || null,
        create: async (datos) => { const nuevo = { id: almacen.length + 1, ...datos }; almacen.push(nuevo); return nuevo; },
        update: async (id, datos) => { almacen = almacen.map((p) => (p.id === id ? { ...p, ...datos } : p)); return almacen.find((p) => p.id === id); },
        remove: async (id) => { const antes = almacen.length; almacen = almacen.filter((p) => p.id !== id); return almacen.length < antes; },
    },
};

const poolPath = require.resolve('../src/config/db');
require.cache[poolPath] = { id: poolPath, filename: poolPath, loaded: true, exports: { query: async () => ({ rows: [{ total: 1 }] }), end: async () => {} } };

const { app } = require('../src/app');

const tokenDePrueba = async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'admin123' });
    return res.body.token;
};

test('GET / responde', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
});

test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    assert.deepEqual(res.body, { status: 'ok', service: 'backendUpb' });
});

test('GET /health/db comprueba la conexión', async () => {
    const res = await request(app).get('/health/db');
    assert.equal(res.body.database, 'connected');
});

test('GET /api/productos es público', async () => {
    const res = await request(app).get('/api/productos');
    assert.equal(res.status, 200);
    assert.equal(res.body[0].nombre, 'Producto de ejemplo');
});

test('GET /api/productos/:id devuelve 404 si no existe', async () => {
    const res = await request(app).get('/api/productos/999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Producto no encontrado');
});

test('POST /api/productos exige token', async () => {
    const res = await request(app).post('/api/productos').send({ nombre: 'X', precio: 1, stock: 1 });
    assert.equal(res.status, 401);
});

test('POST /api/productos crea con token válido', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send({ nombre: 'Nuevo', precio: 3, stock: 2 });
    assert.equal(res.status, 201);
    assert.equal(res.body.nombre, 'Nuevo');
});

test('POST /api/productos valida el cuerpo', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send({ precio: 3 });
    assert.equal(res.status, 400);
});

test('PUT /api/productos/:id actualiza parcialmente', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).put('/api/productos/1').set('Authorization', `Bearer ${token}`).send({ stock: 99 });
    assert.equal(res.status, 200);
    assert.equal(res.body.stock, 99);
    assert.equal(res.body.nombre, 'Producto de ejemplo');
});

test('DELETE /api/productos/:id devuelve 204', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).delete('/api/productos/1').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 204);
});

test('DELETE /api/productos/:id devuelve 404 si ya no existe', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).delete('/api/productos/1').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 404);
});

test('JSON inválido devuelve 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{roto');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'JSON inválido');
});

test('ruta inexistente devuelve 404 en JSON', async () => {
    const res = await request(app).get('/no-existe');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Ruta no encontrada');
});

test('login incorrecto devuelve 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'mala' });
    assert.equal(res.status, 401);
});
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

require('./helpers/entorno');

let reinicios = 0;

// El repositorio de reset se sustituye por uno en memoria: la base de datos real no se toca
const resetRepoPath = require.resolve('../src/repositories/reset.repository');
require.cache[resetRepoPath] = {
    id: resetRepoPath,
    filename: resetRepoPath,
    loaded: true,
    exports: {
        reiniciarBaseDeDatos: async () => {
            reinicios += 1;
            return { productos: 3, pedido: true };
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

test('POST /api/admin/reset exige token de administrador', async () => {
    const res = await request(app).post('/api/admin/reset').send({});
    assert.equal(res.status, 401);
    assert.equal(reinicios, 0);
});

test('POST /api/admin/reset rechaza un token manipulado', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).post('/api/admin/reset').set('Authorization', `Bearer ${token.slice(0, -4)}aaaa`).send({});
    assert.equal(res.status, 401);
    assert.equal(reinicios, 0);
});

test('POST /api/admin/reset se ejecuta con token válido', async () => {
    const token = await tokenDePrueba();
    const res = await request(app).post('/api/admin/reset').set('Authorization', `Bearer ${token}`).send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, 'Base de datos reiniciada');
    assert.equal(res.body.productos, 3);
    assert.equal(reinicios, 1);
});
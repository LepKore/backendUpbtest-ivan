const test = require('node:test');
const assert = require('node:assert/strict');

const consultas = [];
let fallo = null;
let liberado = false;

const clienteFalso = {
    query: async (sql) => {
        consultas.push(sql);
        if (fallo && sql === 'TRUNCATE TABLE pedido_items, pedidos, productos RESTART IDENTITY CASCADE') throw fallo;
        // El seed espera una fila del COUNT y ningun producto todavia
        if (sql.includes('COUNT(*)')) return { rows: [{ total: 0 }] };
        return { rows: [] };
    },
    release: () => { liberado = true; },
};

const poolPath = require.resolve('../src/config/db');
require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: { connect: async () => clienteFalso, query: async () => ({ rows: [] }), end: async () => {} },
};

const { reiniciarBaseDeDatos } = require('../src/repositories/reset.repository');
const { PRODUCTOS_SEED } = require('../src/db/seed');

test('reiniciarBaseDeDatos trunca, crea el esquema e inserta la semilla en una transaccion', async () => {
    consultas.length = 0;
    fallo = null;
    liberado = false;

    const resultado = await reiniciarBaseDeDatos();

    assert.equal(consultas[0], 'BEGIN');
    assert.equal(consultas[1], 'TRUNCATE TABLE pedido_items, pedidos, productos RESTART IDENTITY CASCADE');
    // El esquema entero viaja en una sola consulta
    assert.match(consultas[2], /CREATE TABLE IF NOT EXISTS productos/);
    assert.match(consultas[2], /CREATE TABLE IF NOT EXISTS pedidos/);
    assert.match(consultas[2], /CREATE TABLE IF NOT EXISTS pedido_items/);
    assert.ok(consultas.some((sql) => sql.includes('ON DELETE SET NULL')));
    assert.equal(consultas.filter((sql) => sql.startsWith('INSERT INTO productos')).length, PRODUCTOS_SEED.length);
    assert.equal(consultas.at(-1), 'COMMIT');
    assert.equal(resultado.productos, PRODUCTOS_SEED.length);
    assert.equal(liberado, true);
});

test('reiniciarBaseDeDatos hace ROLLBACK y libera el cliente si una consulta falla', async () => {
    consultas.length = 0;
    liberado = false;
    fallo = new Error('no se pudo truncar');

    await assert.rejects(() => reiniciarBaseDeDatos(), /no se pudo truncar/);

    assert.ok(consultas.includes('ROLLBACK'));
    assert.ok(!consultas.includes('COMMIT'));
    assert.equal(liberado, true);
});
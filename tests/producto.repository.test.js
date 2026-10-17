const test = require('node:test');
const assert = require('node:assert/strict');

// Se sustituye el pool por uno falso para comprobar las consultas generadas
const poolPath = require.resolve('../src/config/db');
const consultas = [];
let respuesta = { rows: [], rowCount: 0 };
require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: { query: async (sql, params) => (consultas.push({ sql, params }), respuesta), end: async () => {} },
};

const repositorio = require('../src/repositories/producto.repository');

test('producto.repository - findAll ordena por id y mapea filas', async () => {
    respuesta = { rows: [{ id: 1, nombre: 'X', precio: '2.00', stock: '3', created_at: 'ayer' }], rowCount: 1 };
    const productos = await repositorio.findAll();
    assert.match(consultas.at(-1).sql, /ORDER BY id/);
    assert.equal(productos[0].precio, 2);
});

test('producto.repository - findById usa parámetro posicional', async () => {
    respuesta = { rows: [{ id: 5, nombre: 'Y', precio: '1', stock: '1', created_at: null }], rowCount: 1 };
    const producto = await repositorio.findById(5);
    assert.deepEqual(consultas.at(-1).params, [5]);
    assert.equal(producto.id, 5);
});

test('producto.repository - create inserta y devuelve la fila', async () => {
    respuesta = { rows: [{ id: 9, nombre: 'Z', precio: '1', stock: '1', created_at: null }], rowCount: 1 };
    const creado = await repositorio.create({ nombre: 'Z', precio: 1, stock: 1 });
    assert.match(consultas.at(-1).sql, /INSERT INTO productos/);
    assert.equal(creado.id, 9);
});

test('producto.repository - update actualiza por id', async () => {
    respuesta = { rows: [{ id: 9, nombre: 'Z2', precio: '1', stock: '1', created_at: null }], rowCount: 1 };
    const actualizado = await repositorio.update(9, { nombre: 'Z2', precio: 1, stock: 1 });
    assert.match(consultas.at(-1).sql, /UPDATE productos/);
    assert.equal(actualizado.nombre, 'Z2');
});

test('producto.repository - remove informa si se borró', async () => {
    respuesta = { rowCount: 1 };
    assert.equal(await repositorio.remove(9), true);
    respuesta = { rowCount: 0 };
    assert.equal(await repositorio.remove(404), false);
});
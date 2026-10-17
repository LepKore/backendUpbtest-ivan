const test = require('node:test');
const assert = require('node:assert/strict');
const Producto = require('../src/entities/producto.entity');

test('producto.entity - convierte precio y stock a número', () => {
    const producto = Producto.fromRow({ id: 1, nombre: 'X', precio: '15.50', stock: '7', created_at: '2026-01-01' });
    assert.equal(producto.precio, 15.5);
    assert.equal(producto.stock, 7);
    assert.equal(producto.createdAt, '2026-01-01');
});

test('producto.entity - devuelve null si no hay fila', () => {
    assert.equal(Producto.fromRow(undefined), null);
});
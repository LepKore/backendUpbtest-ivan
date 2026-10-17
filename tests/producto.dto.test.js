const test = require('node:test');
const assert = require('node:assert/strict');
const { crearProductoDto, actualizarProductoDto, productoResponseDto } = require('../src/dtos/producto.dto');

test('producto.dto - crear exige nombre y aplica valores por defecto', () => {
    const datos = crearProductoDto({ nombre: '  Tartar  ' });
    assert.deepEqual(datos, { nombre: 'Tartar', precio: 0, stock: 0 });
});

test('producto.dto - crear rechaza nombre vacío', () => {
    assert.throws(() => crearProductoDto({ nombre: '   ' }), /nombre/);
});

test('producto.dto - crear rechaza precio negativo', () => {
    assert.throws(() => crearProductoDto({ nombre: 'X', precio: -1 }), /precio/);
});

test('producto.dto - crear rechaza stock no entero', () => {
    assert.throws(() => crearProductoDto({ nombre: 'X', stock: 1.5 }), /stock/);
});

test('producto.dto - crear ignora campos no permitidos', () => {
    const datos = crearProductoDto({ nombre: 'X', precio: 3, stock: 2, hack: 'no' });
    assert.equal(datos.hack, undefined);
});

test('producto.dto - actualizar es parcial', () => {
    assert.deepEqual(actualizarProductoDto({ precio: 9.99 }), { precio: 9.99 });
});

test('producto.dto - actualizar exige al menos un campo', () => {
    assert.throws(() => actualizarProductoDto({}), /al menos un campo/);
});

test('producto.dto - response expone solo el contrato público', () => {
    const salida = productoResponseDto({ id: 1, nombre: 'X', precio: '5.00', stock: '3', createdAt: 'ayer', extra: 1 });
    assert.deepEqual(salida, { id: 1, nombre: 'X', precio: 5, stock: 3, createdAt: 'ayer' });
});
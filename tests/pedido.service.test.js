const test = require('node:test');
const assert = require('node:assert/strict');

let productos = [];
let pedidoCreado = null;
let cancelado = false;

const pedidoRepoPath = require.resolve('../src/repositories/pedido.repository');
require.cache[pedidoRepoPath] = {
    id: pedidoRepoPath,
    filename: pedidoRepoPath,
    loaded: true,
    exports: {
        findAll: async () => [{ id: 1, cliente: 'Ana', total: 10, estado: 'confirmado', items: [] }],
        findById: async (id) => (id === 1 ? { id: 1, cliente: 'Ana', total: 10, estado: 'confirmado', items: [] } : null),
        create: async (datos) => ((pedidoCreado = datos), { id: 1, ...datos, estado: 'confirmado' }),
        cancelar: async (id) => ((cancelado = true), { id, estado: 'cancelado', items: [] }),
    },
};

const productoRepoPath = require.resolve('../src/repositories/producto.repository');
require.cache[productoRepoPath] = {
    id: productoRepoPath,
    filename: productoRepoPath,
    loaded: true,
    exports: { findById: async (id) => productos.find((p) => p.id === id) || null },
};

const servicio = require('../src/services/pedido.service');

test('pedido.service - listar devuelve el historial', async () => {
    const pedidos = await servicio.listar();
    assert.equal(pedidos[0].cliente, 'Ana');
});

test('pedido.service - obtenerPorId lanza 404 si no existe', async () => {
    await assert.rejects(() => servicio.obtenerPorId(99), (error) => error.status === 404);
});

test('pedido.service - crear usa el nombre y el precio de la base de datos', async () => {
    productos = [{ id: 1, nombre: 'Paella', precio: '10.00' }];
    pedidoCreado = null;
    await servicio.crear({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 2 }] });
    assert.deepEqual(pedidoCreado.items, [{ productoId: 1, nombre: 'Paella', precio: 10, cantidad: 2 }]);
    assert.equal(pedidoCreado.cliente, 'Ana');
});

test('pedido.service - crear falla si el producto no existe', async () => {
    productos = [];
    await assert.rejects(() => servicio.crear({ cliente: 'Ana', items: [{ productoId: 7, cantidad: 1 }] }), (error) => error.status === 404);
});

test('pedido.service - cancelar delega en el repositorio', async () => {
    cancelado = false;
    const pedido = await servicio.cancelar(3);
    assert.equal(cancelado, true);
    assert.equal(pedido.estado, 'cancelado');
});

test('pedido.service - valida el id', async () => {
    await assert.rejects(() => servicio.obtenerPorId('abc'), (error) => error.status === 400);
});
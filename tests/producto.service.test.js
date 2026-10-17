const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Se sustituye el repositorio en la caché de módulos para probar el servicio sin base de datos
const repositorioPath = require.resolve('../src/repositories/producto.repository');
const llamadas = [];
require.cache[repositorioPath] = {
    id: repositorioPath,
    filename: repositorioPath,
    loaded: true,
    exports: {
        findAll: async () => [{ id: 1, nombre: 'X', precio: 1, stock: 1 }],
        findById: async (id) => (id === 1 ? { id: 1, nombre: 'X', precio: 1, stock: 1 } : null),
        create: async (datos) => (llamadas.push(datos), { id: 2, ...datos }),
        update: async (id, datos) => ({ id, ...datos }),
        remove: async (id) => (id === 1 ? 1 : 0),
    },
};

const productoService = require('../src/services/producto.service');

test('producto.service - listar devuelve el repositorio', async () => {
    assert.equal((await productoService.listar()).length, 1);
});

test('producto.service - obtener por id', async () => {
    assert.equal((await productoService.obtenerPorId('1')).id, 1);
});

test('producto.service - rechaza ids no numéricos', async () => {
    await assert.rejects(() => productoService.obtenerPorId('abc'), /entero positivo/);
});

test('producto.service - devuelve 404 si no existe', async () => {
    await assert.rejects(() => productoService.obtenerPorId('99'), /no encontrado/);
});

test('producto.service - actualizar conserva los campos no enviados', async () => {
    const actualizado = await productoService.actualizar(1, { precio: 5 });
    assert.equal(actualizado.nombre, 'X');
    assert.equal(actualizado.precio, 5);
});

test('producto.service - eliminarpropaga 404', async () => {
    await assert.rejects(() => productoService.eliminar(99), /no encontrado/);
});

test('producto.service - crear delega en el repositorio', async () => {
    const creado = await productoService.crear({ nombre: 'Y', precio: 2, stock: 3 });
    assert.equal(creado.id, 2);
    assert.deepEqual(llamadas.at(-1), { nombre: 'Y', precio: 2, stock: 3 });
});
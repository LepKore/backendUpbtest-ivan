const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { MIGRACIONES, aplicarMigraciones } = require('../src/db/migraciones');

const schema = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');

test('el esquema permite borrar un producto sin romper el historial de pedidos', () => {
    assert.match(schema, /producto_id INTEGER REFERENCES productos \(id\) ON DELETE SET NULL/);
    assert.ok(!/producto_id INTEGER NOT NULL/.test(schema));
});

test('las migraciones dejan la clave foranea con ON DELETE SET NULL', () => {
    const llave = MIGRACIONES.find((sql) => sql.includes('ADD CONSTRAINT pedido_items_producto_id_fkey'));
    assert.match(llave, /ON DELETE SET NULL/);
    assert.ok(MIGRACIONES.some((sql) => sql.includes('DROP NOT NULL')));
});

test('aplicarMigraciones ejecuta todas las sentencias', async () => {
    const ejecutadas = [];
    await aplicarMigraciones({ query: async (sql) => ejecutadas.push(sql) });
    assert.deepEqual(ejecutadas, MIGRACIONES);
});

test('aplicarMigraciones ignora el error de tabla inexistente', async () => {
    let llamadas = 0;
    const cliente = {
        query: async () => {
            llamadas += 1;
            const error = new Error('no existe la tabla');
            error.code = '42P01';
            throw error;
        },
    };
    await aplicarMigraciones(cliente);
    assert.equal(llamadas, MIGRACIONES.length);
});

test('aplicarMigraciones propaga cualquier otro error', async () => {
    const cliente = {
        query: async () => {
            const error = new Error('permiso denegado');
            error.code = '42501';
            throw error;
        },
    };
    await assert.rejects(() => aplicarMigraciones(cliente), /permiso denegado/);
});
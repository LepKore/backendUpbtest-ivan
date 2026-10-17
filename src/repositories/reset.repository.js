const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { sembrar } = require('../db/seed');
const { aplicarMigraciones } = require('../db/migraciones');

const SCHEMA = fs.readFileSync(path.join(__dirname, '..', 'db/schema.sql'), 'utf8');

// Borra todos los datos y devuelve la base de datos a su estado inicial:
// esquema limpio, contadores de id en 1 y la carta original.
const reiniciarBaseDeDatos = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // RESTART IDENTITY reinicia las secuencias; CASCADE respeta las claves foraneas
        await client.query('TRUNCATE TABLE pedido_items, pedidos, productos RESTART IDENTITY CASCADE');
        await client.query(SCHEMA);
        await aplicarMigraciones(client);
        const resultado = await sembrar(client);
        await client.query('COMMIT');
        return { productos: resultado.productos, pedido: resultado.pedido };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { reiniciarBaseDeDatos };
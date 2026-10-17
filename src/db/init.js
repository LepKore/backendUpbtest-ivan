require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { sembrar } = require('./seed');
const { aplicarMigraciones } = require('./migraciones');

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

const inicializar = async () => {
    await pool.query(sql);
    const client = await pool.connect();
    try {
        await aplicarMigraciones(client);
        return await sembrar(client);
    } finally {
        client.release();
    }
};

inicializar()
    .then((resultado) => console.log(`Tablas creadas y datos iniciales insertados (${resultado.productos} platos) ✅`))
    .catch((err) => console.error('Error al preparar la base de datos ❌', err.message))
    .finally(() => pool.end());
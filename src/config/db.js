require('dotenv').config();
const { Pool } = require('pg');

// El pool se construye siempre a partir de DATABASE_URL: es la unica via de
// configuracion soportada y la documentada en .env.example.
if (!process.env.DATABASE_URL) {
    console.error('Falta la variable de entorno obligatoria: DATABASE_URL');
    throw new Error('Configuracion de base de datos incompleta');
}

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

// Se parsea la URL manualmente porque `pg` ignora las opciones sueltas
// (como `port`) cuando se le pasa `connectionString`.
const url = new URL(process.env.DATABASE_URL);

const pool = new Pool({
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: process.env.DB_PORT || url.port || 5432,
    database: url.pathname.replace(/^\//, ''),
    ssl,
});

module.exports = pool;
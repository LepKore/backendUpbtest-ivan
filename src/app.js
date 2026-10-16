require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const productoRoutes = require('./routes/producto.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API backendUpb funcionando');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'backendUpb' });
});

app.get('/health/db', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Database health check failed:', error.message);
        res.status(503).json({ status: 'error', database: 'unavailable' });
    }
});

app.use('/api/productos', productoRoutes);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores: HttpError usa su status, cualquier otro error es 500
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido' });
    }
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

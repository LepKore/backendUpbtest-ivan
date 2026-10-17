// Migraciones para bases de datos que ya existen (Render).
// Son idempotentes: se ejecutan en cada arranque y solo cambian lo que hace falta.

const MIGRACIONES = [
    // Los items guardan nombre y precio congelados, asi que el producto puede
    // borrarse de la carta sin romper el historial de pedidos.
    'ALTER TABLE pedido_items ALTER COLUMN producto_id DROP NOT NULL',
    'ALTER TABLE pedido_items DROP CONSTRAINT IF EXISTS pedido_items_producto_id_fkey',
    'ALTER TABLE pedido_items ADD CONSTRAINT pedido_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE SET NULL',
];

const aplicarMigraciones = async (client) => {
    for (const sql of MIGRACIONES) {
        try {
            await client.query(sql);
        } catch (error) {
            // La tabla puede no existir todavia en una base recien creada
            if (error.code === '42P01' || error.code === '42703') continue;
            throw error;
        }
    }
};

module.exports = { MIGRACIONES, aplicarMigraciones };
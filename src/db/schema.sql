CREATE TABLE IF NOT EXISTS productos (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    precio     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock      INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
    id         SERIAL PRIMARY KEY,
    cliente    VARCHAR(100) NOT NULL,
    telefono   VARCHAR(30),
    notas      VARCHAR(300),
    estado     VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    total      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_items (
    id          SERIAL PRIMARY KEY,
    pedido_id   INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos (id) ON DELETE SET NULL,
    nombre      VARCHAR(100) NOT NULL,
    precio      NUMERIC(10, 2) NOT NULL,
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0)
);
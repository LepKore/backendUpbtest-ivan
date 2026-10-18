// Los tests fijan su propio entorno para no depender del .env local del desarrollador.
// El operador || conserva el valor real si llega desde el entorno.
process.env.ADMIN_USER = process.env.ADMIN_USER || 'admin';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'secreto-de-test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test';
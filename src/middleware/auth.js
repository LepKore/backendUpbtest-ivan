const crypto = require('crypto');

// Sin estas variables el servidor no arranca: unos credenciales por defecto en el
// codigo permitirian entrar como administrador a cualquiera que lea el repositorio.
const configuracion = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
const ausentes = Object.keys(configuracion).filter((clave) => !configuracion[clave]);
if (ausentes.length) {
    console.error(`Faltan variables de entorno obligatorias: ${ausentes.join(', ')}`);
    throw new Error('Configuracion de autenticacion incompleta');
}

const secret = configuracion.AUTH_SECRET;
const tokenFor = (usuario, timestamp) => crypto.createHmac('sha256', secret).update(`${usuario}:${timestamp}`).digest('hex');
const autenticar = (req, res, next) => {
    const value = req.headers.authorization || '';
    const [scheme, token] = value.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Autenticación requerida' });
    const [usuario, timestamp, firma] = Buffer.from(token, 'base64').toString().split(':');
    const expected = usuario && timestamp ? tokenFor(usuario, timestamp) : '';
    // Se comparan hashes de longitud fija para evitar errores con firmas manipuladas
    const hash = (valor) => crypto.createHash('sha256').update(String(valor)).digest();
    const vigente = Boolean(timestamp) && Date.now() - Number(timestamp) < 8 * 60 * 60 * 1000;
    const firmaValida = Boolean(firma) && crypto.timingSafeEqual(hash(firma), hash(expected));
    if (!firmaValida || !vigente) return res.status(401).json({ error: 'Sesión inválida o expirada' });
    next();
};
const login = (req, res) => { const { usuario, password } = req.body || {}; if (usuario !== configuracion.ADMIN_USER || password !== configuracion.ADMIN_PASSWORD) return res.status(401).json({ error: 'Credenciales incorrectas' }); const timestamp = String(Date.now()); res.json({ token: Buffer.from(`${usuario}:${timestamp}:${tokenFor(usuario, timestamp)}`).toString('base64') }); };
module.exports = { autenticar, login };

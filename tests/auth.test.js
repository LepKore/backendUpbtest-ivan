const test = require('node:test');
const assert = require('node:assert/strict');

require('./helpers/entorno');

const { autenticar, login } = require('../src/middleware/auth');

const ejecutarLogin = (body) => {
    const res = { estado: null, cuerpo: null, json(d) { this.cuerpo = d; return this; }, status(e) { this.estado = e; return this; } };
    login({ body }, res);
    return res;
};

const ejecutarAuth = (authorization) => {
    let avanzado = false;
    const res = { estado: null, cuerpo: null, json(d) { this.cuerpo = d; return this; }, status(e) { this.estado = e; return this; } };
    autenticar({ headers: authorization ? { authorization } : {} }, res, () => { avanzado = true; });
    return { res, avanzado };
};

test('auth - login correcto emite token', () => {
    const res = ejecutarLogin({ usuario: 'admin', password: 'admin123' });
    assert.equal(res.estado, null);
    assert.ok(res.cuerpo.token.length > 0);
});

test('auth - login con credenciales incorrectas devuelve 401', () => {
    const res = ejecutarLogin({ usuario: 'admin', password: 'mala' });
    assert.equal(res.estado, 401);
});

test('auth - login sin cuerpo no filtra información', () => {
    const res = ejecutarLogin(undefined);
    assert.equal(res.estado, 401);
    assert.equal(res.cuerpo.error, 'Credenciales incorrectas');
});

test('auth - el token emitido permite continuar', () => {
    const token = ejecutarLogin({ usuario: 'admin', password: 'admin123' }).cuerpo.token;
    assert.equal(ejecutarAuth(`Bearer ${token}`).avanzado, true);
});

test('auth - sin cabecera devuelve 401', () => {
    const { res, avanzado } = ejecutarAuth(undefined);
    assert.equal(avanzado, false);
    assert.equal(res.estado, 401);
});

test('auth - esquema incorrecto devuelve 401', () => {
    assert.equal(ejecutarAuth('Basic abc').avanzado, false);
});

test('auth - token manipulado devuelve 401', () => {
    const token = ejecutarLogin({ usuario: 'admin', password: 'admin123' }).cuerpo.token;
    assert.equal(ejecutarAuth(`Bearer ${Buffer.from('admin:1:firma').toString('base64')}`).avanzado, false);
    assert.equal(ejecutarAuth(`Bearer ${token.slice(0, -4)}abcd`).avanzado, false);
});

test('auth - token expirado devuelve 401', () => {
    const antiguo = String(Date.now() - 9 * 60 * 60 * 1000);
    const crypto = require('crypto');
    const firma = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(`admin:${antiguo}`).digest('hex');
    const token = Buffer.from(`admin:${antiguo}:${firma}`).toString('base64');
    assert.equal(ejecutarAuth(`Bearer ${token}`).avanzado, false);
});
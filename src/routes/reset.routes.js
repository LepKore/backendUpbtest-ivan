const { Router } = require('express');
const resetController = require('../controllers/reset.controller');
const { autenticar } = require('../middleware/auth');

const router = Router();

// Operacion destructiva: borra productos, pedidos e items y reinicia los contadores.
// Solo un administrador autenticado puede ejecutarla.
router.post('/reset', autenticar, resetController.reiniciar);

module.exports = router;
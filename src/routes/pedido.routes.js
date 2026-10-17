const { Router } = require('express');
const pedidoController = require('../controllers/pedido.controller');
const { autenticar } = require('../middleware/auth');

const router = Router();

// Historial y detalle son publicos (se guardan por nombre y telefono, sin datos sensibles);
// crear un pedido tambien es publico, cancelarlo requiere credenciales de administrador.
router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.obtener);
router.post('/', pedidoController.crear);
router.post('/:id/cancelar', autenticar, pedidoController.cancelar);

module.exports = router;
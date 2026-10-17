const { Router } = require('express');
const productoController = require('../controllers/producto.controller');
const { autenticar } = require('../middleware/auth');

const router = Router();

router.get('/', productoController.listar);
router.get('/:id', productoController.obtener);
router.post('/', autenticar, productoController.crear);
router.put('/:id', autenticar, productoController.actualizar);
router.delete('/:id', autenticar, productoController.eliminar);

module.exports = router;

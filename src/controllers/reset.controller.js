const resetService = require('../services/reset.service');

const reiniciar = async (req, res) => {
    const { productos } = await resetService.reiniciar();
    res.json({ mensaje: 'Base de datos reiniciada', productos });
};

module.exports = { reiniciar };
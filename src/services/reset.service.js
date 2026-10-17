const { reiniciarBaseDeDatos } = require('../repositories/reset.repository');

const reiniciar = async () => {
    const resultado = await reiniciarBaseDeDatos();
    // Queda rastro en los logs del servidor (Render) de quien vacio la base de datos
    console.warn('Base de datos reiniciada por un administrador');
    return resultado;
};

module.exports = { reiniciar };
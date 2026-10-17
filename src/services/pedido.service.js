const pedidoRepository = require('../repositories/pedido.repository');
const productoRepository = require('../repositories/producto.repository');
const HttpError = require('../utils/http-error');

const validarId = (id) => {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
    return numero;
};

const listar = () => pedidoRepository.findAll();

const obtenerPorId = async (id) => {
    const pedido = await pedidoRepository.findById(validarId(id));
    if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
    return pedido;
};

// El nombre y el precio final se toman siempre del producto guardado en la base de datos,
// nunca de lo que envie el cliente.
const crear = async (datos) => {
    const items = [];
    for (const linea of datos.items) {
        const producto = await productoRepository.findById(linea.productoId);
        if (!producto) throw new HttpError(404, `Producto ${linea.productoId} no encontrado`);
        items.push({
            productoId: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: linea.cantidad,
        });
    }
    return pedidoRepository.create({ cliente: datos.cliente, telefono: datos.telefono, notas: datos.notas, items });
};

const cancelar = async (id) => pedidoRepository.cancelar(validarId(id));

module.exports = { listar, obtenerPorId, crear, cancelar };
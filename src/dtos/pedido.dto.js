const HttpError = require('../utils/http-error');

// Valida el pedido que envia el cliente: solo deja pasar cliente, telefono, notas e items
const crearPedidoDto = (body) => {
    const errores = [];
    const { cliente, telefono, notas, items } = body || {};

    if (typeof cliente !== 'string' || cliente.trim() === '') errores.push('"cliente" es obligatorio');
    else if (cliente.trim().length > 100) errores.push('"cliente" no puede superar 100 caracteres');

    if (telefono !== undefined && telefono !== null && typeof telefono !== 'string') {
        errores.push('"telefono" debe ser un texto');
    } else if (typeof telefono === 'string' && telefono.trim().length > 30) {
        errores.push('"telefono" no puede superar 30 caracteres');
    }

    if (notas !== undefined && notas !== null && typeof notas !== 'string') {
        errores.push('"notas" debe ser un texto');
    } else if (typeof notas === 'string' && notas.trim().length > 300) {
        errores.push('"notas" no pueden superar 300 caracteres');
    }

    const lineas = [];
    if (!Array.isArray(items) || items.length === 0) {
        errores.push('"items" debe ser una lista con al menos un producto');
    } else {
        items.forEach((item, indice) => {
            const { productoId, cantidad } = item || {};
            if (!Number.isInteger(productoId) || productoId <= 0) {
                errores.push(`"items[${indice}].productoId" debe ser un entero positivo`);
            }
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                errores.push(`"items[${indice}].cantidad" debe ser un entero mayor que 0`);
            }
            if (Number.isInteger(productoId) && productoId > 0 && Number.isInteger(cantidad) && cantidad > 0) {
                lineas.push({ productoId, cantidad });
            }
        });
    }

    if (errores.length > 0) throw new HttpError(400, errores.join(', '));

    return {
        cliente: cliente.trim(),
        telefono: typeof telefono === 'string' ? telefono.trim() : null,
        notas: typeof notas === 'string' ? notas.trim() : null,
        items: lineas,
    };
};

const pedidoResponseDto = (pedido) => ({
    id: pedido.id,
    cliente: pedido.cliente,
    telefono: pedido.telefono,
    notas: pedido.notas,
    estado: pedido.estado,
    total: Number(pedido.total),
    createdAt: pedido.createdAt,
    items: pedido.items,
});

module.exports = { crearPedidoDto, pedidoResponseDto };
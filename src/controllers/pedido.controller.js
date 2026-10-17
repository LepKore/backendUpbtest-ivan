const pedidoService = require('../services/pedido.service');
const { crearPedidoDto, pedidoResponseDto } = require('../dtos/pedido.dto');

// Express 5 captura los errores de funciones async y los manda al manejador de errores

const listar = async (req, res) => {
    const pedidos = await pedidoService.listar();
    res.json(pedidos.map(pedidoResponseDto));
};

const obtener = async (req, res) => {
    const pedido = await pedidoService.obtenerPorId(req.params.id);
    res.json(pedidoResponseDto(pedido));
};

const crear = async (req, res) => {
    const datos = crearPedidoDto(req.body);
    const pedido = await pedidoService.crear(datos);
    res.status(201).json(pedidoResponseDto(pedido));
};

const cancelar = async (req, res) => {
    const pedido = await pedidoService.cancelar(req.params.id);
    res.json(pedidoResponseDto(pedido));
};

module.exports = { listar, obtener, crear, cancelar };
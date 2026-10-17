const test = require('node:test');
const assert = require('node:assert/strict');

const { crearPedidoDto, pedidoResponseDto } = require('../src/dtos/pedido.dto');

test('pedido.dto - acepta un pedido completo', () => {
    const dto = crearPedidoDto({ cliente: ' Ana ', telefono: ' 600123456 ', notas: ' sin cebolla ', items: [{ productoId: 1, cantidad: 2 }] });
    assert.deepEqual(dto, { cliente: 'Ana', telefono: '600123456', notas: 'sin cebolla', items: [{ productoId: 1, cantidad: 2 }] });
});

test('pedido.dto - telefono y notas son opcionales', () => {
    const dto = crearPedidoDto({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 1 }] });
    assert.equal(dto.telefono, null);
    assert.equal(dto.notas, null);
});

test('pedido.dto - exige cliente', () => {
    assert.throws(() => crearPedidoDto({ items: [{ productoId: 1, cantidad: 1 }] }), (e) => e.status === 400 && /cliente/.test(e.message));
});

test('pedido.dto - exige al menos un item', () => {
    assert.throws(() => crearPedidoDto({ cliente: 'Ana', items: [] }), (e) => e.status === 400 && /items/.test(e.message));
});

test('pedido.dto - rechaza cantidades no positivas', () => {
    assert.throws(() => crearPedidoDto({ cliente: 'Ana', items: [{ productoId: 1, cantidad: 0 }] }), (e) => e.status === 400);
});

test('pedido.dto - rechaza productoId inválido', () => {
    assert.throws(() => crearPedidoDto({ cliente: 'Ana', items: [{ productoId: 'x', cantidad: 1 }] }), (e) => e.status === 400);
});

test('pedido.dto - rechaza textos demasiado largos', () => {
    assert.throws(() => crearPedidoDto({ cliente: 'a'.repeat(101), items: [{ productoId: 1, cantidad: 1 }] }), (e) => e.status === 400);
    assert.throws(() => crearPedidoDto({ cliente: 'Ana', notas: 'a'.repeat(301), items: [{ productoId: 1, cantidad: 1 }] }), (e) => e.status === 400);
});

test('pedido.dto - la respuesta expone total como número', () => {
    const respuesta = pedidoResponseDto({ id: 1, cliente: 'Ana', telefono: null, notas: null, estado: 'confirmado', total: '12.50', createdAt: 'hoy', items: [] });
    assert.equal(respuesta.total, 12.5);
    assert.equal(respuesta.estado, 'confirmado');
});
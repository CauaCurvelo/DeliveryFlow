const Pedido = require('../models/pedido');
const { pedidosMemoria } = require('../storage/memoryStore');
const { isMongoConnected } = require('../config/database');

async function listPedidos() {
  if (isMongoConnected()) {
    return Pedido.find().sort({ criadoEm: -1 });
  }
  return [...pedidosMemoria].sort((a, b) => b.criadoEm - a.criadoEm);
}

async function createPedido(data) {
  if (isMongoConnected()) {
    const pedido = new Pedido(data);
    await pedido.save();
    return pedido;
  }

  const pedido = {
    _id: Date.now().toString(),
    ...data
  };
  pedidosMemoria.push(pedido);
  return pedido;
}

async function updatePedido(id, updates) {
  if (isMongoConnected()) {
    return Pedido.findByIdAndUpdate(id, updates, { new: true });
  }

  const index = pedidosMemoria.findIndex((pedido) => pedido._id === id);
  if (index === -1) {
    return null;
  }

  pedidosMemoria[index] = {
    ...pedidosMemoria[index],
    ...updates
  };

  return pedidosMemoria[index];
}

async function removePedido(id) {
  if (isMongoConnected()) {
    const pedido = await Pedido.findById(id);
    if (pedido) {
      await Pedido.findByIdAndDelete(id);
    }
    return pedido;
  }

  const index = pedidosMemoria.findIndex((pedido) => pedido._id === id);
  if (index === -1) {
    return null;
  }

  const [pedidoRemovido] = pedidosMemoria.splice(index, 1);
  return pedidoRemovido;
}

async function getPedidoById(id) {
  if (isMongoConnected()) {
    return Pedido.findById(id);
  }

  return pedidosMemoria.find((pedido) => pedido._id === id) || null;
}

module.exports = {
  listPedidos,
  createPedido,
  updatePedido,
  removePedido,
  getPedidoById
};

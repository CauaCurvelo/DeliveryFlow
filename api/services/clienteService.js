const Cliente = require('../models/cliente');
const Pedido = require('../models/pedido');
const { clientesMemoria } = require('../storage/memoryStore');
const { isMongoConnected } = require('../config/database');

async function listClientes() {
  if (isMongoConnected()) {
    const clientes = await Cliente.find().sort({ ultimoPedido: -1 });
    const clientesComTotal = await Promise.all(
      clientes.map(async (cliente) => {
        const totalPedidos = await Pedido.countDocuments({ telefone: cliente.telefone });
        return {
          ...cliente.toObject(),
          totalPedidos
        };
      })
    );
    return clientesComTotal;
  }

  return clientesMemoria;
}

async function findClienteByTelefone(telefone) {
  if (isMongoConnected()) {
    return Cliente.findOne({ telefone });
  }

  return clientesMemoria.find((cliente) => cliente.telefone === telefone) || null;
}

async function removeCliente(id) {
  if (isMongoConnected()) {
    return Cliente.findByIdAndDelete(id);
  }

  const index = clientesMemoria.findIndex((cliente) => cliente._id === id);
  if (index === -1) {
    return null;
  }

  return clientesMemoria.splice(index, 1);
}

async function upsertCliente({ telefone, nome }) {
  if (!telefone || !nome) {
    return null;
  }

  if (isMongoConnected()) {
    return Cliente.findOneAndUpdate(
      { telefone },
      { nome, ultimoPedido: new Date() },
      { upsert: true, new: true }
    );
  }

  const index = clientesMemoria.findIndex((cliente) => cliente.telefone === telefone);
  if (index === -1) {
    const cliente = {
      _id: Date.now().toString(),
      telefone,
      nome,
      criadoEm: new Date(),
      ultimoPedido: new Date()
    };
    clientesMemoria.push(cliente);
    return cliente;
  }

  clientesMemoria[index] = {
    ...clientesMemoria[index],
    nome,
    ultimoPedido: new Date()
  };

  return clientesMemoria[index];
}

module.exports = {
  listClientes,
  findClienteByTelefone,
  removeCliente,
  upsertCliente
};

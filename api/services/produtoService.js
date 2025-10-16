const Produto = require('../models/produto');
const { produtosMemoria } = require('../storage/memoryStore');
const { isMongoConnected } = require('../config/database');

async function listProdutos() {
  if (isMongoConnected()) {
    return Produto.find().sort({ criadoEm: -1 });
  }
  return produtosMemoria;
}

async function createProduto(data) {
  if (isMongoConnected()) {
    const produto = new Produto(data);
    await produto.save();
    return produto;
  }

  const produto = {
    _id: `P${Date.now()}`,
    ...data
  };
  produtosMemoria.push(produto);
  return produto;
}

async function updateProduto(id, updates) {
  if (isMongoConnected()) {
    return Produto.findByIdAndUpdate(id, updates, { new: true });
  }

  const index = produtosMemoria.findIndex((produto) => produto._id === id);
  if (index === -1) {
    return null;
  }

  produtosMemoria[index] = {
    ...produtosMemoria[index],
    ...updates
  };

  return produtosMemoria[index];
}

async function removeProduto(id) {
  if (isMongoConnected()) {
    return Produto.findByIdAndDelete(id);
  }

  const index = produtosMemoria.findIndex((produto) => produto._id === id);
  if (index === -1) {
    return null;
  }

  produtosMemoria.splice(index, 1);
  return true;
}

module.exports = {
  listProdutos,
  createProduto,
  updateProduto,
  removeProduto
};

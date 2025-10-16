const { mongoose } = require('../config/database');

const produtoSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  preco: Number,
  categoria: String,
  imagem: String,
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Produto || mongoose.model('Produto', produtoSchema);

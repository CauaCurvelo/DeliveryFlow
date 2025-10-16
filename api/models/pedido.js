const { mongoose } = require('../config/database');

const pedidoSchema = new mongoose.Schema({
  nome: String,
  telefone: String,
  texto: String,
  itens: [
    {
      produtoId: String,
      nome: String,
      quantidade: Number,
      preco: Number
    }
  ],
  status: { type: String, default: 'pending' },
  total: { type: Number, default: 0 },
  metodoPagamento: String,
  modoEntrega: String,
  endereco: String,
  observacoes: String,
  humanTakeover: { type: Boolean, default: false },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Pedido || mongoose.model('Pedido', pedidoSchema);

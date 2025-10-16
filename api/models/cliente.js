const { mongoose } = require('../config/database');

const clienteSchema = new mongoose.Schema({
  telefone: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
  ultimoPedido: { type: Date }
});

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);

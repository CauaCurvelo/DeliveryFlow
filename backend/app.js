// Estrutura inicial do backend Express
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { Client } = require('whatsapp-web.js');
const { NlpManager } = require('node-nlp');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/deliveryflow', { useNewUrlParser: true, useUnifiedTopology: true });

// Pedido Schema
const pedidoSchema = new mongoose.Schema({
  nome: String,
  telefone: String,
  texto: String,
  itens: Array,
  status: { type: String, default: 'pending' },
  criadoEm: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', pedidoSchema);

// NLP Manager
const manager = new NlpManager({ languages: ['pt'], forceNER: true });
// Exemplo de treinamento
manager.addDocument('pt', 'quero pedir uma pizza', 'pedido.pizza');
manager.addDocument('pt', 'quero pedir um lanche', 'pedido.lanche');
manager.addDocument('pt', 'quero pedir uma coca', 'pedido.bebida');
manager.addAnswer('pt', 'pedido.pizza', 'Pedido de pizza identificado!');
manager.addAnswer('pt', 'pedido.lanche', 'Pedido de lanche identificado!');
manager.addAnswer('pt', 'pedido.bebida', 'Pedido de bebida identificado!');
(async () => { await manager.train(); manager.save(); })();

// WhatsApp Client
const whatsapp = new Client();
whatsapp.on('message', async msg => {
  const { from, body } = msg;
  const nlp = await manager.process('pt', body);
  let itens = [];
  if (nlp.intent === 'pedido.pizza') itens.push({ tipo: 'pizza', nome: 'Pizza', quantidade: 1 });
  if (nlp.intent === 'pedido.lanche') itens.push({ tipo: 'lanche', nome: 'Lanche', quantidade: 1 });
  if (nlp.intent === 'pedido.bebida') itens.push({ tipo: 'bebida', nome: 'Bebida', quantidade: 1 });
  // Filtrar itens válidos
  const itensValidos = itens.filter(i => i.nome && i.nome.trim() !== '' && i.tipo && i.tipo.trim() !== '');
  if (itensValidos.length > 0) {
    // Salva pedido no banco
    const pedido = new Pedido({ nome: '', telefone: from, texto: body, itens: itensValidos });
    await pedido.save();
    io.emit('novo-pedido', pedido); // Envia para o front via WebSocket
    msg.reply('Seu pedido foi recebido e está sendo processado!');
  }
});
whatsapp.initialize();

// API REST para listar pedidos
app.get('/api/pedidos', async (req, res) => {
  const pedidos = await Pedido.find().sort({ criadoEm: -1 });
  res.json(pedidos);
});

// WebSocket para atualização em tempo real
io.on('connection', socket => {
  console.log('Front conectado via WebSocket');
});

// Inicia servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});

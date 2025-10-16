const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { NlpManager } = require('node-nlp');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  } 
});

app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

console.log('🚀 Iniciando DeliveryFlow Backend...');

// MongoDB connection (opcional - funciona sem MongoDB também)
let mongoConnected = false;
mongoose.connect('mongodb://localhost:27017/deliveryflow', {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB conectado');
  mongoConnected = true;
})
.catch(err => {
  console.log('⚠️  MongoDB não disponível, usando memória RAM');
  mongoConnected = false;
});

// Schemas
const clienteSchema = new mongoose.Schema({
  telefone: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
  ultimoPedido: { type: Date }
});

const pedidoSchema = new mongoose.Schema({
  nome: String,
  telefone: String,
  texto: String,
  itens: [{
    produtoId: String,
    nome: String,
    quantidade: Number,
    preco: Number
  }],
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

const produtoSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  preco: Number,
  categoria: String,
  imagem: String,
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now }
});

const Cliente = mongoose.model('Cliente', clienteSchema);
const Pedido = mongoose.model('Pedido', pedidoSchema);
const Produto = mongoose.model('Produto', produtoSchema);

// Storage em memória (fallback se MongoDB não estiver disponível)
let pedidosMemoria = [];
let produtosMemoria = [
  {
    _id: 'P1',
    nome: 'Pizza Margherita G',
    descricao: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    preco: 45.00,
    categoria: 'Pizzas',
    imagem: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P2',
    nome: 'X-Burger Bacon',
    descricao: 'Hambúrguer artesanal, queijo, bacon crocante, alface e tomate',
    preco: 28.00,
    categoria: 'Burgers',
    imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P3',
    nome: 'Salada Caesar',
    descricao: 'Alface romana, croutons, parmesão e molho caesar',
    preco: 32.00,
    categoria: 'Saladas',
    imagem: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P4',
    nome: 'Pasta Carbonara',
    descricao: 'Massa fresca com molho carbonara, bacon e parmesão',
    preco: 38.00,
    categoria: 'Massas',
    imagem: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P5',
    nome: 'Refrigerante 2L',
    descricao: 'Coca-Cola, Guaraná ou Sprite',
    preco: 10.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P6',
    nome: 'Batata Frita G',
    descricao: 'Batatas fritas crocantes com sal especial',
    preco: 18.00,
    categoria: 'Acompanhamentos',
    imagem: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P7',
    nome: 'Tiramisu',
    descricao: 'Sobremesa italiana tradicional com café e mascarpone',
    preco: 15.00,
    categoria: 'Sobremesas',
    imagem: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P8',
    nome: 'Pizza Calabresa G',
    descricao: 'Molho de tomate, mussarela, calabresa e cebola',
    preco: 48.00,
    categoria: 'Pizzas',
    imagem: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P9',
    nome: 'Suco Natural 500ml',
    descricao: 'Laranja, Limão, Maracujá ou Morango',
    preco: 8.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P10',
    nome: 'Suco de Laranja',
    descricao: 'Suco de laranja natural 500ml',
    preco: 8.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P11',
    nome: 'Suco de Limão',
    descricao: 'Suco de limão natural 500ml',
    preco: 7.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe1e07?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P12',
    nome: 'Água Mineral',
    descricao: 'Água mineral sem gás 500ml',
    preco: 3.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    ativo: true,
    criadoEm: new Date()
  }
];

// Configurações do bot em memória
let botConfigMemoria = {
  horarioFuncionamento: {
    horaAbertura: '18:00',
    horaFechamento: '23:00',
    diasFuncionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
  }
};

// Configurações de mesas em memória
let tableConfigMemoria = {
  totalTables: 20
};

// Configurações gerais em memória
let generalConfigMemoria = {
  taxaEntrega: 5.00,
  pedidoMinimo: 15.00,
  telefone: '',
  whatsapp: '',
  instagram: '',
  notificacoesSonoras: true,
};

// NLP Manager
console.log('🧠 Inicializando NLP...');
const manager = new NlpManager({ languages: ['pt'], forceNER: true });

// Treinamento do NLP
manager.addDocument('pt', 'quero pedir uma pizza', 'pedido.pizza');
manager.addDocument('pt', 'quero uma pizza', 'pedido.pizza');
manager.addDocument('pt', 'pizza margherita', 'pedido.pizza');
manager.addDocument('pt', 'gostaria de um hambúrguer', 'pedido.hamburguer');
manager.addDocument('pt', 'quero um burger', 'pedido.hamburguer');
manager.addDocument('pt', 'x-burger', 'pedido.hamburguer');
manager.addDocument('pt', 'quero uma coca', 'pedido.bebida');
manager.addDocument('pt', 'refrigerante', 'pedido.bebida');
manager.addDocument('pt', 'fazer pedido', 'pedido.generic');
manager.addDocument('pt', 'quero pedir', 'pedido.generic');
manager.addDocument('pt', 'cardápio', 'cardapio');
manager.addDocument('pt', 'menu', 'cardapio');
manager.addDocument('pt', 'o que tem?', 'cardapio');
manager.addDocument('pt', 'quanto custa', 'preco');
manager.addDocument('pt', 'qual o valor', 'preco');
manager.addDocument('pt', 'falar com atendente', 'humano');
manager.addDocument('pt', 'quero falar com alguém', 'humano');

manager.addAnswer('pt', 'pedido.pizza', 'Ótima escolha! Pizza anotada.');
manager.addAnswer('pt', 'pedido.hamburguer', 'Hambúrguer anotado!');
manager.addAnswer('pt', 'pedido.bebida', 'Bebida anotada!');
manager.addAnswer('pt', 'pedido.generic', 'Pedido recebido!');
manager.addAnswer('pt', 'cardapio', 'Vou te mostrar nosso cardápio!');
manager.addAnswer('pt', 'preco', 'Vou verificar os preços para você!');
manager.addAnswer('pt', 'humano', 'Transferindo para atendente humano...');

// ============================================
// WHATSAPP BOT COM CHATBOT FLOW COMPLETO
// ============================================

let whatsappReady = false;
let chatbot = null;
let whatsappBotEnabled = false; // Sempre inicia desativado

// Importar ChatbotFlow
const ChatbotFlowModule = require('./chatbot-flow');
const ChatbotHandlers = require('./chatbot-handlers');

// Mesclar handlers na classe
class ChatbotFlowCompleto extends ChatbotFlowModule.ChatbotFlow {
  constructor(produtosModel, pedidosModel, clienteModel, io) {
    super(produtosModel, pedidosModel, io);
    
    // Adicionar modelo de Cliente
    this.Cliente = clienteModel;
    
    // Adicionar todos os handlers
    Object.assign(this, ChatbotHandlers);
  }
}

// Inicializar chatbot
try {
  chatbot = new ChatbotFlowCompleto(Produto, Pedido, Cliente, io, botConfigMemoria);
  console.log('🤖 Chatbot Flow inicializado');
} catch (error) {
  console.error('❌ Erro ao inicializar Chatbot:', error);
}

// WhatsApp Client com configuração otimizada para Windows
// URLs alternativas para cache remoto do WhatsApp Web
const WA_CACHE_URLS = [
  process.env.WA_CACHE_URL || 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
  'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2402.5-beta.html',
  'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2407.3.html'
];

let client;
let waCacheIndex = 0;
function createWhatsAppClient() {
  console.log(`[WhatsApp] Criando cliente com cache URL: ${WA_CACHE_URLS[waCacheIndex]}`);
  return new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ],
      timeout: 120000,
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false
    },
    webVersionCache: {
      remotePath: WA_CACHE_URLS[waCacheIndex],
      type: 'remote'
    },
    qrMaxRetries: 5
  });
}

function initializeWhatsAppClient() {
  if (client) {
    console.log('⚠️  WhatsApp client já existe, destruindo antiga instância...');
    try {
      client.destroy();
    } catch (e) {
      console.log('Ignorando erro ao destruir cliente antigo:', e.message);
    }
  }

  client = createWhatsAppClient();
  const startTime = Date.now();
  let lastStepTime = startTime;
  let qrCount = 0;

  function logStep(step) {
    const now = Date.now();
    const elapsed = ((now - lastStepTime) / 1000).toFixed(2);
    lastStepTime = now;
    console.log(`[WhatsApp] ${step} (+${elapsed}s)`);
    io.emit('whatsapp-progress', { step, elapsed });
  }

  logStep('Iniciando WhatsApp Client');

  // Evento QR Code
  client.on('qr', (qr) => {
    qrCount++;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔑 QR Code #${qrCount} - Escaneie o QR Code abaixo para conectar o WhatsApp:`);
    // Exibe o QR Code como imagem no terminal
    try {
      const qrcode = require('qrcode-terminal');
      qrcode.generate(qr, { small: true });
    } catch (e) {
      console.log('Erro ao gerar QR Code no terminal:', e.message);
      console.log(qr);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep(`QR Code gerado (tentativa ${qrCount})`);
    io.emit('whatsapp-qr', qr);
  });

  // Evento de autenticação bem-sucedida
  client.on('authenticated', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 WhatsApp AUTENTICADO com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('WhatsApp autenticado');
    io.emit('whatsapp-authenticated');
  });

  // Evento de cliente pronto
  client.on('ready', () => {
    whatsappReady = true;
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WhatsApp CONECTADO e PRONTO para uso!');
    console.log(`   Tempo total de inicialização: ${totalTime}s`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('WhatsApp pronto para uso');
    io.emit('whatsapp-status', { connected: true });
    io.emit('whatsapp-ready');
  });

  // Evento de falha na autenticação
  client.on('auth_failure', (msg) => {
    whatsappReady = false;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ FALHA na autenticação do WhatsApp');
    console.log('   Motivo:', msg);
    console.log('   Tente novamente ou reinicie o backend');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('Falha na autenticação');
    io.emit('whatsapp-auth-failure', msg);
  });

  // Evento de desconexão
  client.on('disconnected', (reason) => {
    whatsappReady = false;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  WhatsApp DESCONECTADO');
    console.log('   Motivo:', reason);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logStep('WhatsApp desconectado');
    io.emit('whatsapp-disconnected', reason);
  });

  // Evento de tela de carregamento
  client.on('loading_screen', (percent, message) => {
    console.log(`[WhatsApp] Carregando: ${percent}% - ${message}`);
    logStep(`Carregando WhatsApp: ${percent}% - ${message}`);
  });

  // Evento de mudança de estado
  client.on('change_state', (state) => {
    console.log(`[WhatsApp] Mudança de estado: ${state}`);
    logStep(`Estado alterado para: ${state}`);
  });

  client.on('message', async msg => {
    try {
      // Ignorar mensagens de status, grupos e números diferentes do teste
      if (
        msg.from === 'status@broadcast' ||
        msg.isGroupMsg ||
        msg.from !== '557791860449@c.us'
      ) {
        return;
      }

      const telefone = msg.from;
      const mensagem = msg.body;
      console.log(`📨 ${telefone}: ${mensagem}`);

      // Só responde se o bot estiver ativado
      if (!whatsappBotEnabled) {
        // Não responde absolutamente nada
        return;
      }
      if (chatbot) {
        const resposta = await chatbot.processarMensagem(telefone, mensagem);
        if (resposta) {
          await msg.reply(resposta);
          console.log(`📤 Bot → ${telefone}: ${resposta.substring(0, 50)}...`);
        }
      } else {
        // Fallback caso chatbot não tenha inicializado
        const nlp = await manager.process('pt', mensagem);
        await msg.reply(nlp.answer || 'Estamos processando sua mensagem...');
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem WhatsApp:', error);
      try {
        await msg.reply('😔 Desculpe, ocorreu um erro. Por favor, tente novamente ou digite *atendente* para falar com uma pessoa.');
      } catch (e) {
        console.error('❌ Erro ao enviar mensagem de erro:', e);
      }
    }
  });

  // Inicializar WhatsApp Client
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 INICIALIZANDO WHATSAPP CLIENT...');
  console.log('   Configurações:');
  console.log(`   - Cache URL: ${WA_CACHE_URLS[waCacheIndex]}`);
  console.log('   - Timeout: 120 segundos');
  console.log('   - Max QR retries: 5');
  console.log('   Isso pode levar 10-60 segundos');
  console.log('   Aguardando Puppeteer inicializar...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  client.initialize()
    .then(() => {
      console.log('✅ WhatsApp Client inicializado com sucesso!');
      console.log('⏳ Aguardando geração do QR Code...');
      logStep('Cliente inicializado, aguardando QR');
    })
    .catch(error => {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERRO AO INICIALIZAR WHATSAPP');
      console.error('   Tipo de erro:', error.name);
      console.error('   Mensagem:', error.message);
      if (error.stack) {
        console.error('   Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
      }
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  Backend continuará funcionando sem WhatsApp');
      console.log('   Você ainda pode usar o painel web normalmente');
      
      // Tentar com URL alternativa
      if (waCacheIndex < WA_CACHE_URLS.length - 1) {
        waCacheIndex++;
        console.log(`\n🔄 Tentando novamente com URL alternativa (${waCacheIndex + 1}/${WA_CACHE_URLS.length})...`);
        setTimeout(() => {
          initializeWhatsAppClient();
        }, 5000);
      }
    });
}

// ============================================
// API REST - PEDIDOS
// ============================================

// Endpoint para ativar/desativar o bot do WhatsApp
app.post('/api/whatsapp/bot', (req, res) => {
  const { enabled } = req.body;
  whatsappBotEnabled = !!enabled;
  console.log(`🤖 WhatsApp Bot agora está ${whatsappBotEnabled ? 'ATIVO' : 'DESATIVADO'}`);
  io.emit('whatsapp-bot-status', whatsappBotEnabled);
  res.json({ enabled: whatsappBotEnabled });
});

// Endpoint para consultar status do bot
app.get('/api/whatsapp/bot', (req, res) => {
  res.json({ enabled: whatsappBotEnabled });
});

// Listar todos os pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    let pedidos;
    if (mongoConnected) {
      pedidos = await Pedido.find().sort({ criadoEm: -1 });
    } else {
      pedidos = pedidosMemoria.sort((a, b) => b.criadoEm - a.criadoEm);
    }
    console.log(`📋 Listando ${pedidos.length} pedidos`);
    res.json(pedidos);
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar pedido manualmente
app.post('/api/pedidos', async (req, res) => {
  try {
    // Mapeia campos do frontend para o schema do backend
    const pedidoData = {
      nome: req.body.customerName || req.body.nome,
      telefone: req.body.customerPhone || req.body.telefone,
      texto: req.body.texto,
      itens: req.body.items || req.body.itens,
      status: req.body.status || 'pending',
      total: req.body.total,
      metodoPagamento: req.body.paymentMethod || req.body.metodoPagamento,
      modoEntrega: req.body.deliveryMode || req.body.modoEntrega,
      endereco: req.body.address || req.body.endereco,
      observacoes: req.body.notes || req.body.observacoes,
      humanTakeover: req.body.humanTakeover || false,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    // Salvar/atualizar cliente se telefone foi fornecido
    if (pedidoData.telefone && pedidoData.nome && mongoConnected) {
      try {
        await Cliente.findOneAndUpdate(
          { telefone: pedidoData.telefone },
          { 
            nome: pedidoData.nome, 
            ultimoPedido: new Date() 
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Cliente salvo/atualizado: ${pedidoData.nome} (${pedidoData.telefone})`);
      } catch (err) {
        console.error('⚠️ Erro ao salvar cliente:', err);
      }
    }
    
    let pedido;
    if (mongoConnected) {
      pedido = new Pedido(pedidoData);
      await pedido.save();
    } else {
      pedido = { 
        _id: Date.now().toString(), 
        ...pedidoData 
      };
      pedidosMemoria.push(pedido);
    }
    
    console.log('✅ Pedido criado:', pedido._id);
    io.emit('novo-pedido', pedido);
    res.status(201).json(pedido);
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do pedido
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, atualizadoEm: new Date() };
    
    let pedido;
    if (mongoConnected) {
      pedido = await Pedido.findByIdAndUpdate(id, updates, { new: true });
    } else {
      const index = pedidosMemoria.findIndex(p => p._id === id);
      if (index !== -1) {
        pedidosMemoria[index] = { ...pedidosMemoria[index], ...updates };
        pedido = pedidosMemoria[index];
      }
    }
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    console.log('✅ Pedido atualizado:', id);
    io.emit('pedido-atualizado', pedido);
    res.json(pedido);
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let pedido;
    if (mongoConnected) {
      pedido = await Pedido.findById(id);
      if (pedido) await Pedido.findByIdAndDelete(id);
    } else {
      const index = pedidosMemoria.findIndex(p => p._id === id);
      if (index !== -1) {
        pedido = pedidosMemoria[index];
        pedidosMemoria.splice(index, 1);
      }
    }
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    // Remover da fila do painel
    io.emit('pedido-cancelado', { id });
    // Enviar mensagem para o cliente via WhatsApp
    if (pedido.telefone) {
      try {
        await client.sendMessage(
          pedido.telefone,
          '❌ Seu pedido foi cancelado pelo restaurante. Em breve um atendente irá informar o motivo. Se precisar de algo, responda esta mensagem.'
        );
      } catch (err) {
        console.error('Erro ao enviar mensagem de cancelamento:', err);
      }
    }
    console.log('✅ Pedido cancelado e removido:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API REST - PRODUTOS
// ============================================

// Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    let produtos;
    if (mongoConnected) {
      produtos = await Produto.find().sort({ criadoEm: -1 });
    } else {
      produtos = produtosMemoria;
    }
    console.log(`📦 Listando ${produtos.length} produtos`);
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const produtoData = {
      ...req.body,
      criadoEm: new Date()
    };
    
    let produto;
    if (mongoConnected) {
      produto = new Produto(produtoData);
      await produto.save();
    } else {
      produto = { 
        _id: 'P' + Date.now(), 
        ...produtoData 
      };
      produtosMemoria.push(produto);
    }
    
    console.log('✅ Produto criado:', produto._id);
    io.emit('produto-criado', produto);
    res.status(201).json(produto);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    let produto;
    if (mongoConnected) {
      produto = await Produto.findByIdAndUpdate(id, updates, { new: true });
    } else {
      const index = produtosMemoria.findIndex(p => p._id === id);
      if (index !== -1) {
        produtosMemoria[index] = { ...produtosMemoria[index], ...updates };
        produto = produtosMemoria[index];
      }
    }
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log('✅ Produto atualizado:', id);
    io.emit('produto-atualizado', produto);
    res.json(produto);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (mongoConnected) {
      await Produto.findByIdAndDelete(id);
    } else {
      produtosMemoria = produtosMemoria.filter(p => p._id !== id);
    }
    
    console.log('✅ Produto deletado:', id);
    io.emit('produto-deletado', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API REST - CLIENTES
// ============================================

// Listar todos os clientes
app.get('/api/clientes', async (req, res) => {
  try {
    let clientes;
    if (mongoConnected) {
      clientes = await Cliente.find().sort({ ultimoPedido: -1 });
      // Calcular total de pedidos para cada cliente
      const clientesComTotal = await Promise.all(clientes.map(async (cliente) => {
        const totalPedidos = await Pedido.countDocuments({ telefone: cliente.telefone });
        return {
          ...cliente.toObject(),
          totalPedidos
        };
      }));
      clientes = clientesComTotal;
    } else {
      clientes = clientesMemoria || [];
    }
    console.log(`👥 Listando ${clientes.length} clientes`);
    res.json(clientes);
  } catch (error) {
    console.error('❌ Erro ao listar clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar cliente por telefone
app.get('/api/clientes/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    let cliente;
    if (mongoConnected) {
      cliente = await Cliente.findOne({ telefone });
    } else {
      cliente = clientesMemoria?.find(c => c.telefone === telefone);
    }
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar cliente
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoConnected) {
      await Cliente.findByIdAndDelete(id);
    } else {
      clientesMemoria = clientesMemoria?.filter(c => c._id !== id) || [];
    }
    console.log('✅ Cliente deletado:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API REST - CONFIGURAÇÕES DO BOT
// ============================================

// Obter configurações do bot
app.get('/api/config/bot', (req, res) => {
  console.log('📋 Obtendo configurações do bot');
  res.json(botConfigMemoria);
});

// Salvar configurações do bot
app.put('/api/config/bot', (req, res) => {
  try {
    const { horarioFuncionamento } = req.body;
    if (horarioFuncionamento) {
      // Corrigir dias para string
      let dias = horarioFuncionamento.diasFuncionamento || [];
      dias = dias.map(function(d) {
        if (typeof d === 'number') {
          // Converte número para string
          return ['domingo','segunda','terca','quarta','quinta','sexta','sabado'][d] || d;
        }
        return d;
      });
      botConfigMemoria.horarioFuncionamento = {
        ...botConfigMemoria.horarioFuncionamento,
        ...horarioFuncionamento,
        diasFuncionamento: dias
      };
      // Atualizar config do chatbot em tempo real
      if (chatbot) {
        chatbot.config.horarioFuncionamento = { ...botConfigMemoria.horarioFuncionamento };
      }
    }
    console.log('Configurações do bot atualizadas:', botConfigMemoria);
    io.emit('config-atualizada', botConfigMemoria);
    res.json(botConfigMemoria);
  } catch (error) {
    console.error('Erro ao salvar configurações do bot:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API REST - CONFIGURAÇÕES DE MESAS
// ============================================

// Obter configurações de mesas
app.get('/api/config/tables', (req, res) => {
  console.log('📋 Obtendo configurações de mesas');
  res.json(tableConfigMemoria);
});

// Salvar configurações de mesas
app.put('/api/config/tables', (req, res) => {
  try {
    const { totalTables } = req.body;
    if (totalTables && typeof totalTables === 'number' && totalTables >= 1 && totalTables <= 99) {
      tableConfigMemoria.totalTables = totalTables;
      console.log('Configurações de mesas atualizadas:', tableConfigMemoria);
      io.emit('tables-config-atualizada', tableConfigMemoria);
      res.json(tableConfigMemoria);
    } else {
      res.status(400).json({ error: 'totalTables deve ser um número entre 1 e 99' });
    }
  } catch (error) {
    console.error('Erro ao salvar configurações de mesas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter configurações gerais
app.get('/api/config/general', (req, res) => {
  console.log('📋 Obtendo configurações gerais');
  res.json(generalConfigMemoria);
});

// Salvar configurações gerais
app.put('/api/config/general', (req, res) => {
  try {
    const { taxaEntrega, pedidoMinimo, telefone, whatsapp, instagram, notificacoesSonoras } = req.body;
    
    if (taxaEntrega !== undefined) generalConfigMemoria.taxaEntrega = taxaEntrega;
    if (pedidoMinimo !== undefined) generalConfigMemoria.pedidoMinimo = pedidoMinimo;
    if (telefone !== undefined) generalConfigMemoria.telefone = telefone;
    if (whatsapp !== undefined) generalConfigMemoria.whatsapp = whatsapp;
    if (instagram !== undefined) generalConfigMemoria.instagram = instagram;
    if (notificacoesSonoras !== undefined) generalConfigMemoria.notificacoesSonoras = notificacoesSonoras;
    
    console.log('✅ Configurações gerais atualizadas:', generalConfigMemoria);
    io.emit('general-config-atualizada', generalConfigMemoria);
    res.json(generalConfigMemoria);
  } catch (error) {
    console.error('❌ Erro ao salvar configurações gerais:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API - UTILIDADES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    mongodb: mongoConnected,
    whatsapp: whatsappReady
  });
});

// Status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: whatsappReady,
    needsQR: !whatsappReady,
    message: whatsappReady ? 'WhatsApp conectado!' : 'Aguardando conexão...'
  });
});

// Endpoint para reconectar WhatsApp sem reiniciar backend
app.post('/api/whatsapp/reconnect', async (req, res) => {
  try {
    if (client) {
      try {
        await client.destroy();
      } catch (e) {
        // Ignora erro EBUSY
        if (e.code !== 'EBUSY') throw e;
        console.warn('⚠️ EBUSY ao destruir cliente WhatsApp, ignorando...');
      }
    }
    whatsappReady = false;
    client.initialize()
      .then(() => {
        console.log('✅ WhatsApp Client reinicializado!');
      })
      .catch(error => {
        console.error('❌ Erro ao reinicializar WhatsApp:', error);
      });
    res.json({ success: true, message: 'WhatsApp reinicializando...' });
  } catch (error) {
    console.error('❌ Erro ao reinicializar WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter informações da sessão do chatbot (para debug)
app.get('/api/chatbot/sessoes', (req, res) => {
  if (!chatbot) {
    return res.status(503).json({ error: 'Chatbot não disponível' });
  }
  
  // Retornar número de sessões ativas (sem dados sensíveis)
  const ChatbotFlowModule = require('./chatbot-flow');
  res.json({
    sessoesAtivas: ChatbotFlowModule.sessoes ? ChatbotFlowModule.sessoes.size : 0
  });
});

// Processar texto com NLP
app.post('/api/nlp/process', async (req, res) => {
  try {
    const { texto } = req.body;
    const result = await manager.process('pt', texto);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao processar NLP:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WEBSOCKET - TEMPO REAL
// ============================================

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  // Enviar dados iniciais para novo cliente
  socket.on('request-initial-data', async () => {
    try {
      let pedidos, produtos;
      
      if (mongoConnected) {
        pedidos = await Pedido.find().sort({ criadoEm: -1 });
        produtos = await Produto.find();
      } else {
        pedidos = pedidosMemoria;
        produtos = produtosMemoria;
      }
      
      socket.emit('initial-data', { pedidos, produtos });
      console.log('📤 Dados iniciais enviados para', socket.id);
    } catch (error) {
      console.error('❌ Erro ao enviar dados iniciais:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // Atualizar status de pedido via WebSocket
  socket.on('update-pedido', async (data) => {
    try {
      const { id, updates } = data;
      const atualizacao = { ...updates, atualizadoEm: new Date() };
      
      let pedido;
      if (mongoConnected) {
        pedido = await Pedido.findByIdAndUpdate(id, atualizacao, { new: true });
      } else {
        const index = pedidosMemoria.findIndex(p => p._id === id);
        if (index !== -1) {
          pedidosMemoria[index] = { ...pedidosMemoria[index], ...atualizacao };
          pedido = pedidosMemoria[index];
        }
      }
      
      if (pedido) {
        io.emit('pedido-atualizado', pedido);
        console.log('✅ Pedido atualizado via WebSocket:', id);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar pedido via WebSocket:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // Criar pedido via WebSocket
  socket.on('create-pedido', async (pedidoData) => {
    try {
      const novoPedido = {
        ...pedidoData,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };
      
      let pedido;
      if (mongoConnected) {
        pedido = new Pedido(novoPedido);
        await pedido.save();
      } else {
        pedido = { 
          _id: Date.now().toString(), 
          ...novoPedido 
        };
        pedidosMemoria.push(pedido);
      }
      
      io.emit('novo-pedido', pedido);
      console.log('✅ Pedido criado via WebSocket:', pedido._id);
    } catch (error) {
      console.error('❌ Erro ao criar pedido via WebSocket:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // Processar mensagem NLP via WebSocket
  socket.on('process-message', async (message) => {
    try {
      const result = await manager.process('pt', message);
      socket.emit('nlp-result', result);
      
      // Se for um pedido, criar automaticamente
      if (result.intent && result.intent.startsWith('pedido.')) {
        const pedidoData = {
          cliente: 'Cliente WebSocket',
          telefone: 'N/A',
          mensagem: message,
          produtos: extractProductsFromNLP(result),
          status: 'pending',
          humanTakeover: false,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        };
        
        let pedido;
        if (mongoConnected) {
          pedido = new Pedido(pedidoData);
          await pedido.save();
        } else {
          pedido = { 
            _id: Date.now().toString(), 
            ...pedidoData 
          };
          pedidosMemoria.push(pedido);
        }
        
        io.emit('novo-pedido', pedido);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem NLP:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Função auxiliar para extrair produtos do resultado NLP
function extractProductsFromNLP(nlpResult) {
  const produtos = [];
  
  // Mapeamento simples de intents para produtos
  if (nlpResult.intent === 'pedido.pizza') {
    produtos.push({ nome: 'Pizza', quantidade: 1 });
  } else if (nlpResult.intent === 'pedido.hamburguer') {
    produtos.push({ nome: 'Hambúrguer', quantidade: 1 });
  } else if (nlpResult.intent === 'pedido.bebida') {
    produtos.push({ nome: 'Bebida', quantidade: 1 });
  }
  
  return produtos;
}

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const PORT = 4000;

// Função para iniciar o servidor

async function startServer() {
  try {
    // Treinar NLP primeiro
    await manager.train();
    manager.save();
    console.log('✅ NLP treinado e salvo');
    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log(`✅ Backend rodando em http://localhost:${PORT}`);
      console.log(`   MongoDB: ${mongoConnected ? '✅ Conectado' : '⚠️  Modo memória'}`);
      console.log(`   WhatsApp: ${whatsappReady ? '✅ Ativo' : '⚠️  Desativado'}`);
      console.log(`   NLP: ✅ Ativo`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // Inicializar WhatsApp client após o backend subir
      initializeWhatsAppClient();
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar tudo
startServer();

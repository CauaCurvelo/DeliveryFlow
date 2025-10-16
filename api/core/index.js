const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectMongo, isMongoConnected } = require('../config/database');
const Cliente = require('../models/cliente');
const Pedido = require('../models/pedido');
const Produto = require('../models/produto');
const {
	pedidosMemoria,
	produtosMemoria,
	clientesMemoria,
	botConfigMemoria,
	tableConfigMemoria,
	generalConfigMemoria
} = require('../storage/memoryStore');
const { createNlpManager, trainAndSave } = require('../services/nlpService');
const WhatsAppService = require('../services/whatsappService');
const { registerSocketService } = require('../services/socketService');
const pedidoService = require('../services/pedidoService');
const produtoService = require('../services/produtoService');
const clienteService = require('../services/clienteService');
const { createPedidosRouter } = require('../routes/pedidos');
const { createProdutosRouter } = require('../routes/produtos');
const { createClientesRouter } = require('../routes/clientes');
const { createConfigRouter } = require('../routes/config');
const { createWhatsAppRouter } = require('../routes/whatsapp');
const { createUtilRouter } = require('../routes/util');
const ChatbotFlowModule = require('./chatbot-flow');
const ChatbotHandlers = require('./chatbot-handlers');

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
app.use((req, res, next) => {
	console.log(`📥 ${req.method} ${req.url}`);
	next();
});

console.log('🚀 Iniciando DeliveryFlow Backend...');

class ChatbotFlowCompleto extends ChatbotFlowModule.ChatbotFlow {
	constructor(produtosModel, pedidosModel, clienteModel, ioInstance, config) {
		super(produtosModel, pedidosModel, ioInstance, config);
		this.Cliente = clienteModel;
		Object.assign(this, ChatbotHandlers);
	}
}

let chatbot = null;
try {
	chatbot = new ChatbotFlowCompleto(
		Produto,
		Pedido,
		Cliente,
		io,
		botConfigMemoria
	);
	console.log('🤖 Chatbot Flow inicializado');
} catch (error) {
	console.error('❌ Erro ao inicializar Chatbot:', error);
}

const manager = createNlpManager();
const whatsappService = new WhatsAppService({ io, manager, chatbot });

app.use(
	'/api/pedidos',
	createPedidosRouter({ pedidoService, clienteService, io, whatsappService })
);
app.use('/api/produtos', createProdutosRouter({ produtoService, io }));
app.use('/api/clientes', createClientesRouter({ clienteService }));
app.use(
	'/api/config',
	createConfigRouter({ botConfigMemoria, tableConfigMemoria, generalConfigMemoria, chatbot, io })
);
app.use('/api/whatsapp', createWhatsAppRouter({ whatsappService }));
app.use(
	'/api',
	createUtilRouter({
		isMongoConnected,
		whatsappService,
		manager,
		getChatbotSessionsCount: chatbot ? () => ChatbotFlowModule.sessoes.size : null
	})
);

registerSocketService({ io, pedidoService, produtoService, manager });

const PORT = process.env.PORT || 4000;

async function startServer() {
	try {
		await connectMongo();
		await trainAndSave(manager);

		server.listen(PORT, () => {
			console.log(`✅ Backend rodando em http://localhost:${PORT}`);
			console.log(`   MongoDB: ${isMongoConnected() ? '✅ Conectado' : '⚠️  Modo memória'}`);
			console.log(`   WhatsApp: ${whatsappService.isReady() ? '✅ Ativo' : '⚠️  Desativado'}`);
			console.log('   NLP: ✅ Ativo');
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			whatsappService.initialize();
		});
	} catch (error) {
		console.error('❌ Erro ao iniciar servidor:', error);
		process.exit(1);
	}
}

startServer();

module.exports = {
	app,
	server,
	io,
	manager,
	chatbot,
	whatsappService,
	memoryStores: {
		pedidosMemoria,
		produtosMemoria,
		clientesMemoria,
		botConfigMemoria,
		tableConfigMemoria,
		generalConfigMemoria
	}
};


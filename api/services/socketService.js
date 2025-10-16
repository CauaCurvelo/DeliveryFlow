const { extractProductsFromNLP } = require('../utils/nlpUtils');

function registerSocketService({ io, pedidoService, produtoService, manager }) {
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    socket.on('request-initial-data', async () => {
      try {
        const pedidos = await pedidoService.listPedidos();
        const produtos = await produtoService.listProdutos();

        socket.emit('initial-data', { pedidos, produtos });
        console.log('📤 Dados iniciais enviados para', socket.id);
      } catch (error) {
        console.error('❌ Erro ao enviar dados iniciais:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('update-pedido', async ({ id, updates }) => {
      try {
        const atualizacao = { ...updates, atualizadoEm: new Date() };
        const pedido = await pedidoService.updatePedido(id, atualizacao);

        if (pedido) {
          io.emit('pedido-atualizado', pedido);
          console.log('✅ Pedido atualizado via WebSocket:', id);
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar pedido via WebSocket:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('create-pedido', async (pedidoData) => {
      try {
        const novoPedido = {
          ...pedidoData,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        };

        const pedido = await pedidoService.createPedido(novoPedido);
        io.emit('novo-pedido', pedido);
        console.log('✅ Pedido criado via WebSocket:', pedido._id);
      } catch (error) {
        console.error('❌ Erro ao criar pedido via WebSocket:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('process-message', async (message) => {
      try {
        const result = await manager.process('pt', message);
        socket.emit('nlp-result', result);

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

          const pedido = await pedidoService.createPedido(pedidoData);
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
}

module.exports = {
  registerSocketService
};

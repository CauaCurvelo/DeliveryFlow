const express = require('express');

function createPedidosRouter({ pedidoService, clienteService, io, whatsappService, generalConfigMemoria }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const pedidos = await pedidoService.listPedidos();
      console.log(`📋 Listando ${pedidos.length} pedidos`);
      res.json(pedidos);
    } catch (error) {
      console.error('❌ Erro ao listar pedidos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const modoEntrega = req.body.deliveryMode || req.body.modoEntrega;
      let total = req.body.total;
      
      // Adicionar taxa de delivery se for delivery, usando o valor configurado
      if (modoEntrega === 'delivery') {
        const taxaEntrega = generalConfigMemoria?.taxaEntrega || 5;
        total = (total || 0) + taxaEntrega;
      }
      
      const pedidoData = {
        nome: req.body.customerName || req.body.nome,
        telefone: req.body.customerPhone || req.body.telefone,
        texto: req.body.texto,
        itens: req.body.items || req.body.itens,
        status: req.body.status || 'pending',
        total: total,
        metodoPagamento: req.body.paymentMethod || req.body.metodoPagamento,
        modoEntrega: modoEntrega,
        endereco: req.body.address || req.body.endereco,
        observacoes: req.body.notes || req.body.observacoes,
        humanTakeover: req.body.humanTakeover || false,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      if (pedidoData.telefone && pedidoData.nome) {
        try {
          await clienteService.upsertCliente({ telefone: pedidoData.telefone, nome: pedidoData.nome });
        } catch (clienteError) {
          console.error('⚠️ Erro ao salvar cliente:', clienteError);
        }
      }

      const pedido = await pedidoService.createPedido(pedidoData);
      console.log('✅ Pedido criado:', pedido._id);

      io.emit('novo-pedido', pedido);
      res.status(201).json(pedido);
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, atualizadoEm: new Date() };
      const pedido = await pedidoService.updatePedido(id, updates);

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

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await pedidoService.removePedido(id);

      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      io.emit('pedido-cancelado', { id });

      const client = whatsappService.getClient();
      if (pedido.telefone && client) {
        try {
          await client.sendMessage(
            pedido.telefone,
            '❌ Seu pedido foi cancelado pelo restaurante. Em breve um atendente irá informar o motivo. Se precisar de algo, responda esta mensagem.'
          );
        } catch (sendError) {
          console.error('Erro ao enviar mensagem de cancelamento:', sendError);
        }
      }

      console.log('✅ Pedido cancelado e removido:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao cancelar pedido:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createPedidosRouter
};

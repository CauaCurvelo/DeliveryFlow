const express = require('express');

function normalizeDiasFuncionamento(dias) {
  if (!Array.isArray(dias)) {
    return [];
  }

  const diasNomes = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dias.map((dia) => {
    if (typeof dia === 'number') {
      return diasNomes[dia] || dia;
    }
    return dia;
  });
}

function createConfigRouter({ botConfigMemoria, tableConfigMemoria, generalConfigMemoria, chatbot, io }) {
  const router = express.Router();

  router.get('/bot', (req, res) => {
    console.log('📋 Obtendo configurações do bot');
    res.json(botConfigMemoria);
  });

  router.put('/bot', (req, res) => {
    try {
      const { horarioFuncionamento } = req.body;

      if (horarioFuncionamento) {
        const diasFuncionamento = normalizeDiasFuncionamento(horarioFuncionamento.diasFuncionamento);
        botConfigMemoria.horarioFuncionamento = {
          ...botConfigMemoria.horarioFuncionamento,
          ...horarioFuncionamento,
          diasFuncionamento
        };

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

  router.get('/tables', (req, res) => {
    console.log('📋 Obtendo configurações de mesas');
    res.json(tableConfigMemoria);
  });

  router.put('/tables', (req, res) => {
    try {
      const { totalTables } = req.body;

      if (totalTables && typeof totalTables === 'number' && totalTables >= 1 && totalTables <= 99) {
        tableConfigMemoria.totalTables = totalTables;
        console.log('Configurações de mesas atualizadas:', tableConfigMemoria);
        io.emit('tables-config-atualizada', tableConfigMemoria);
        return res.json(tableConfigMemoria);
      }

      res.status(400).json({ error: 'totalTables deve ser um número entre 1 e 99' });
    } catch (error) {
      console.error('Erro ao salvar configurações de mesas:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/general', (req, res) => {
    console.log('📋 Obtendo configurações gerais');
    res.json(generalConfigMemoria);
  });

  router.put('/general', (req, res) => {
    try {
      const { taxaEntrega, pedidoMinimo, telefone, whatsapp, instagram, notificacoesSonoras, botAtivo } = req.body;

      if (taxaEntrega !== undefined) generalConfigMemoria.taxaEntrega = taxaEntrega;
      if (pedidoMinimo !== undefined) generalConfigMemoria.pedidoMinimo = pedidoMinimo;
      if (telefone !== undefined) generalConfigMemoria.telefone = telefone;
      if (whatsapp !== undefined) generalConfigMemoria.whatsapp = whatsapp;
      if (instagram !== undefined) generalConfigMemoria.instagram = instagram;
      if (notificacoesSonoras !== undefined) generalConfigMemoria.notificacoesSonoras = notificacoesSonoras;
      if (botAtivo !== undefined) {
        generalConfigMemoria.botAtivo = botAtivo;
        console.log(`🤖 Bot ${botAtivo ? 'ATIVADO' : 'DESATIVADO'}`);
        
        // Atualizar o chatbot se existir
        if (chatbot) {
          chatbot.config.botAtivo = botAtivo;
        }
      }

      console.log('✅ Configurações gerais atualizadas:', generalConfigMemoria);
      io.emit('general-config-atualizada', generalConfigMemoria);
      res.json(generalConfigMemoria);
    } catch (error) {
      console.error('❌ Erro ao salvar configurações gerais:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createConfigRouter
};

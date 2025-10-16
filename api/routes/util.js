const express = require('express');

function createUtilRouter({ isMongoConnected, whatsappService, manager, getChatbotSessionsCount }) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      mongodb: isMongoConnected(),
      whatsapp: whatsappService.isReady()
    });
  });

  router.get('/chatbot/sessoes', (req, res) => {
    if (!getChatbotSessionsCount) {
      return res.status(503).json({ error: 'Chatbot não disponível' });
    }

    res.json({ sessoesAtivas: getChatbotSessionsCount() });
  });

  router.post('/nlp/process', async (req, res) => {
    try {
      const { texto } = req.body;
      const result = await manager.process('pt', texto);
      res.json(result);
    } catch (error) {
      console.error('❌ Erro ao processar NLP:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createUtilRouter
};

const express = require('express');

function createWhatsAppRouter({ whatsappService }) {
  const router = express.Router();

  router.post('/bot', (req, res) => {
    const { enabled } = req.body;
    const status = whatsappService.setBotEnabled(enabled);
    res.json({ enabled: status });
  });

  router.get('/bot', (req, res) => {
    res.json({ enabled: whatsappService.isBotEnabled() });
  });

  router.get('/status', (req, res) => {
    const connected = whatsappService.isReady();
    res.json({
      connected,
      needsQR: !connected,
      message: connected ? 'WhatsApp conectado!' : 'Aguardando conexão...'
    });
  });

  router.post('/reconnect', async (req, res) => {
    try {
      const result = await whatsappService.reconnect();
      res.json(result);
    } catch (error) {
      console.error('❌ Erro ao reinicializar WhatsApp:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createWhatsAppRouter
};

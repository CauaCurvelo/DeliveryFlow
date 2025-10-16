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

  router.post('/clear-session', async (req, res) => {
    try {
      console.log('🧹 Recebida requisição para limpar sessão do WhatsApp');
      const cleaned = await whatsappService.cleanAuthSession();
      res.json({ 
        success: cleaned,
        message: cleaned 
          ? 'Sessão limpa com sucesso. Use /reconnect para iniciar uma nova conexão.' 
          : 'Nenhuma sessão encontrada para limpar.'
      });
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createWhatsAppRouter
};

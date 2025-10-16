const { Client, LocalAuth } = require('whatsapp-web.js');

const WA_CACHE_URLS = [
  process.env.WA_CACHE_URL || 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
  'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2402.5-beta.html',
  'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2407.3.html'
];

class WhatsAppService {
  constructor({ io, manager, chatbot }) {
    this.io = io;
    this.manager = manager;
    this.chatbot = chatbot;

    this.client = null;
    this.whatsappReady = false;
    this.whatsappBotEnabled = false;
    this.waCacheIndex = 0;
  }

  isReady() {
    return this.whatsappReady;
  }

  isBotEnabled() {
    return this.whatsappBotEnabled;
  }

  setBotEnabled(enabled) {
    this.whatsappBotEnabled = !!enabled;
    console.log(`🤖 WhatsApp Bot agora está ${this.whatsappBotEnabled ? 'ATIVO' : 'DESATIVADO'}`);
    this.io.emit('whatsapp-bot-status', this.whatsappBotEnabled);
    return this.whatsappBotEnabled;
  }

  getClient() {
    return this.client;
  }

  logStep(step, lastStepTimeRef) {
    const now = Date.now();
    const elapsed = ((now - lastStepTimeRef.value) / 1000).toFixed(2);
    lastStepTimeRef.value = now;
    console.log(`[WhatsApp] ${step} (+${elapsed}s)`);
    this.io.emit('whatsapp-progress', { step, elapsed });
  }

  createClient() {
    console.log(`[WhatsApp] Criando cliente com cache URL: ${WA_CACHE_URLS[this.waCacheIndex]}`);
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
        remotePath: WA_CACHE_URLS[this.waCacheIndex],
        type: 'remote'
      },
      qrMaxRetries: 5
    });
  }

  initialize() {
    if (this.client) {
      console.log('⚠️  WhatsApp client já existe, destruindo antiga instância...');
      try {
        this.client.destroy();
      } catch (err) {
        console.log('Ignorando erro ao destruir cliente antigo:', err.message);
      }
    }

    this.client = this.createClient();
    this.whatsappReady = false;

    const startTime = Date.now();
    const lastStepTimeRef = { value: startTime };
    let qrCount = 0;

    const logStep = (step) => this.logStep(step, lastStepTimeRef);

    logStep('Iniciando WhatsApp Client');

    this.client.on('qr', (qr) => {
      qrCount += 1;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🔑 QR Code #${qrCount} - Escaneie o QR Code abaixo para conectar o WhatsApp:`);
      try {
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
      } catch (err) {
        console.log('Erro ao gerar QR Code no terminal:', err.message);
        console.log(qr);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep(`QR Code gerado (tentativa ${qrCount})`);
      this.io.emit('whatsapp-qr', qr);
    });

    this.client.on('authenticated', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔒 WhatsApp AUTENTICADO com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp autenticado');
      this.io.emit('whatsapp-authenticated');
    });

    this.client.on('ready', () => {
      this.whatsappReady = true;
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ WhatsApp CONECTADO e PRONTO para uso!');
      console.log(`   Tempo total de inicialização: ${totalTime}s`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp pronto para uso');
      this.io.emit('whatsapp-status', { connected: true });
      this.io.emit('whatsapp-ready');
    });

    this.client.on('auth_failure', (msg) => {
      this.whatsappReady = false;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ FALHA na autenticação do WhatsApp');
      console.log('   Motivo:', msg);
      console.log('   Tente novamente ou reinicie o backend');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('Falha na autenticação');
      this.io.emit('whatsapp-auth-failure', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.whatsappReady = false;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  WhatsApp DESCONECTADO');
      console.log('   Motivo:', reason);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp desconectado');
      this.io.emit('whatsapp-disconnected', reason);
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`[WhatsApp] Carregando: ${percent}% - ${message}`);
      logStep(`Carregando WhatsApp: ${percent}% - ${message}`);
    });

    this.client.on('change_state', (state) => {
      console.log(`[WhatsApp] Mudança de estado: ${state}`);
      logStep(`Estado alterado para: ${state}`);
    });

    this.client.on('message', async (msg) => {
      try {
        if (msg.from === 'status@broadcast' || msg.isGroupMsg || msg.from !== '557791860449@c.us') {
          return;
        }

        const telefone = msg.from;
        const mensagem = msg.body;
        console.log(`📨 ${telefone}: ${mensagem}`);

        if (!this.whatsappBotEnabled) {
          return;
        }

        if (this.chatbot) {
          const resposta = await this.chatbot.processarMensagem(telefone, mensagem);
          if (resposta) {
            await msg.reply(resposta);
            console.log(`📤 Bot → ${telefone}: ${resposta.substring(0, 50)}...`);
          }
        } else if (this.manager) {
          const nlp = await this.manager.process('pt', mensagem);
          await msg.reply(nlp.answer || 'Estamos processando sua mensagem...');
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem WhatsApp:', error);
        try {
          await msg.reply('😔 Desculpe, ocorreu um erro. Por favor, tente novamente ou digite *atendente* para falar com uma pessoa.');
        } catch (replyError) {
          console.error('❌ Erro ao enviar mensagem de erro:', replyError);
        }
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 INICIALIZANDO WHATSAPP CLIENT...');
    console.log('   Configurações:');
    console.log(`   - Cache URL: ${WA_CACHE_URLS[this.waCacheIndex]}`);
    console.log('   - Timeout: 120 segundos');
    console.log('   - Max QR retries: 5');
    console.log('   Isso pode levar 10-60 segundos');
    console.log('   Aguardando Puppeteer inicializar...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.client
      .initialize()
      .then(() => {
        console.log('✅ WhatsApp Client inicializado com sucesso!');
        console.log('⏳ Aguardando geração do QR Code...');
        logStep('Cliente inicializado, aguardando QR');
      })
      .catch((error) => {
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

        if (this.waCacheIndex < WA_CACHE_URLS.length - 1) {
          this.waCacheIndex += 1;
          console.log(`\n🔄 Tentando novamente com URL alternativa (${this.waCacheIndex + 1}/${WA_CACHE_URLS.length})...`);
          setTimeout(() => {
            this.initialize();
          }, 5000);
        }
      });
  }

  async reconnect() {
    if (!this.client) {
      this.initialize();
      return { success: true, message: 'WhatsApp inicializando...' };
    }

    try {
      await this.client.destroy();
    } catch (error) {
      if (error.code !== 'EBUSY') {
        throw error;
      }
      console.warn('⚠️ EBUSY ao destruir cliente WhatsApp, ignorando...');
    }

    this.whatsappReady = false;
    this.initialize();
    return { success: true, message: 'WhatsApp reinicializando...' };
  }
}

module.exports = WhatsAppService;

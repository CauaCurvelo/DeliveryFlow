const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

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
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    this.qrCodeTimeout = null;
    this.syncTimeout = null;
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

  async cleanAuthSession() {
    const authPath = path.join(__dirname, '..', '.wwebjs_auth');
    console.log('🧹 Limpando sessão antiga do WhatsApp...');
    try {
      if (fs.existsSync(authPath)) {
        const files = fs.readdirSync(authPath);
        for (const file of files) {
          const filePath = path.join(authPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
        console.log('✅ Sessão antiga removida com sucesso');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao limpar sessão:', error.message);
    }
    return false;
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
          '--disable-extensions',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 180000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      },
      webVersionCache: {
        remotePath: WA_CACHE_URLS[this.waCacheIndex],
        type: 'remote'
      },
      qrMaxRetries: 5,
      authTimeoutMs: 180000,
      takeoverOnConflict: true,
      takeoverTimeoutMs: 0
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

    if (this.qrCodeTimeout) {
      clearTimeout(this.qrCodeTimeout);
      this.qrCodeTimeout = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    this.client = this.createClient();
    this.whatsappReady = false;

    const startTime = Date.now();
    const lastStepTimeRef = { value: startTime };
    let qrCount = 0;
    let qrReceived = false;

    const logStep = (step) => this.logStep(step, lastStepTimeRef);

    logStep('Iniciando WhatsApp Client');

    this.client.on('qr', (qr) => {
      qrCount += 1;
      qrReceived = true;
      
      if (this.qrCodeTimeout) {
        clearTimeout(this.qrCodeTimeout);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🔑 QR Code #${qrCount} - Escaneie o QR Code abaixo para conectar o WhatsApp:`);
      console.log('⏰ Você tem 60 segundos para escanear este QR Code');
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

      this.qrCodeTimeout = setTimeout(() => {
        if (!this.whatsappReady && qrCount >= 3) {
          console.log('⏰ Timeout do QR Code após 3 tentativas. Reiniciando...');
          this.reconnect();
        }
      }, 60000);
    });

    this.client.on('authenticated', () => {
      if (this.qrCodeTimeout) {
        clearTimeout(this.qrCodeTimeout);
        this.qrCodeTimeout = null;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔒 WhatsApp AUTENTICADO com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp autenticado');
      this.io.emit('whatsapp-authenticated');
      this.initializationAttempts = 0; // Reset contador de tentativas
    });

    this.client.on('ready', () => {
      this.whatsappReady = true;
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Limpar timeouts
      if (this.qrCodeTimeout) {
        clearTimeout(this.qrCodeTimeout);
        this.qrCodeTimeout = null;
      }
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ WhatsApp CONECTADO e PRONTO para uso!');
      console.log(`   Tempo total de inicialização: ${totalTime}s`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp pronto para uso');
      this.io.emit('whatsapp-status', { connected: true });
      this.io.emit('whatsapp-ready');
      this.initializationAttempts = 0; // Reset contador de tentativas
    });

    this.client.on('auth_failure', async (msg) => {
      this.whatsappReady = false;
      
      // Limpar timeout do QR Code
      if (this.qrCodeTimeout) {
        clearTimeout(this.qrCodeTimeout);
        this.qrCodeTimeout = null;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ FALHA na autenticação do WhatsApp');
      console.log('   Motivo:', msg);
      console.log('   Limpando sessão e tentando novamente...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('Falha na autenticação');
      this.io.emit('whatsapp-auth-failure', msg);
      
      this.initializationAttempts++;
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        console.log(`🔄 Tentativa ${this.initializationAttempts} de ${this.maxInitializationAttempts}...`);
        await this.cleanAuthSession();
        setTimeout(() => {
          this.initialize();
        }, 3000);
      } else {
        console.log('❌ Número máximo de tentativas atingido. Aguarde e tente reconectar manualmente.');
        this.initializationAttempts = 0;
      }
    });

    this.client.on('disconnected', async (reason) => {
      this.whatsappReady = false;
      
      // Limpar timeout do QR Code
      if (this.qrCodeTimeout) {
        clearTimeout(this.qrCodeTimeout);
        this.qrCodeTimeout = null;
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  WhatsApp DESCONECTADO');
      console.log('   Motivo:', reason);
      console.log('   Tentando reconectar em 5 segundos...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logStep('WhatsApp desconectado');
      this.io.emit('whatsapp-disconnected', reason);
      
      setTimeout(() => {
        console.log('🔄 Tentando reconectar...');
        this.reconnect();
      }, 5000);
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`[WhatsApp] Carregando: ${percent}% - ${message}`);
      logStep(`Carregando WhatsApp: ${percent}% - ${message}`);
      this.io.emit('whatsapp-loading', { percent, message });
      
      if (message.toLowerCase().includes('sincronizando') || message.toLowerCase().includes('syncing')) {
        if (this.syncTimeout) {
          clearTimeout(this.syncTimeout);
        }
        
        this.syncTimeout = setTimeout(() => {
          if (!this.whatsappReady) {
            console.log('⚠️ WhatsApp preso em sincronização. Reiniciando conexão...');
            this.reconnect();
          }
        }, 45000); // 45 segundos de timeout para sincronização
      }
    });

    this.client.on('change_state', (state) => {
      console.log(`[WhatsApp] Mudança de estado: ${state}`);
      logStep(`Estado alterado para: ${state}`);
    });

    this.client.on('message', async (msg) => {
      try {
        // Ignorar mensagens de status e grupos
        if (msg.from === 'status@broadcast' || msg.isGroupMsg) {
          return;
        }

        const telefone = msg.from;
        const mensagem = msg.body;
        console.log(`📨 ${telefone}: ${mensagem}`);

        const { generalConfigMemoria } = require('../storage/memoryStore');
        if (!generalConfigMemoria.botAtivo) {
          console.log('🤖 Bot desativado, mensagem ignorada');
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
        console.log('💡 Dica: Se o QR Code não aparecer em 30 segundos, tente limpar a sessão');
        logStep('Cliente inicializado, aguardando QR');
        
        // Timeout adicional se não houver QR Code
        setTimeout(() => {
          if (!qrReceived && !this.whatsappReady) {
            console.log('⏰ QR Code não foi gerado. Tentando limpar sessão...');
            this.reconnect();
          }
        }, 30000);
      })
      .catch(async (error) => {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERRO AO INICIALIZAR WHATSAPP');
        console.error('   Tipo de erro:', error.name);
        console.error('   Mensagem:', error.message);
        if (error.stack) {
          console.error('   Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.initializationAttempts++;
        
        if (this.initializationAttempts < this.maxInitializationAttempts) {
          console.log(`\n🔄 Tentativa ${this.initializationAttempts} de ${this.maxInitializationAttempts}...`);
          console.log('🧹 Limpando sessão antiga...');
          await this.cleanAuthSession();
          
          if (this.waCacheIndex < WA_CACHE_URLS.length - 1) {
            this.waCacheIndex += 1;
            console.log(`🌐 Tentando com URL alternativa (${this.waCacheIndex + 1}/${WA_CACHE_URLS.length})...`);
          }
          
          setTimeout(() => {
            this.initialize();
          }, 5000);
        } else {
          console.log('⚠️  Backend continuará funcionando sem WhatsApp');
          console.log('   Você ainda pode usar o painel web normalmente');
          console.log('   Para tentar conectar novamente, use a rota POST /whatsapp/reconnect');
          this.initializationAttempts = 0;
        }
      });
  }

  async reconnect() {
    console.log('🔄 Iniciando processo de reconexão...');
    
    // Limpar todos os timeouts
    if (this.qrCodeTimeout) {
      clearTimeout(this.qrCodeTimeout);
      this.qrCodeTimeout = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    if (this.client) {
      try {
        console.log('🗑️ Destruindo cliente antigo...');
        await this.client.destroy();
        console.log('✅ Cliente antigo destruído');
      } catch (error) {
        if (error.code !== 'EBUSY') {
          console.error('⚠️ Erro ao destruir cliente:', error.message);
        } else {
          console.warn('⚠️ EBUSY ao destruir cliente WhatsApp, ignorando...');
        }
      }
    }

    // Limpar sessão antiga
    await this.cleanAuthSession();

    this.whatsappReady = false;
    this.waCacheIndex = 0; // Reset para primeira URL
    this.initializationAttempts = 0; // Reset tentativas
    
    console.log('🚀 Reinicializando WhatsApp...');
    setTimeout(() => {
      this.initialize();
    }, 2000);
    
    return { success: true, message: 'WhatsApp reinicializando com sessão limpa...' };
  }
}

module.exports = WhatsAppService;

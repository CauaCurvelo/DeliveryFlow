// ============================================
// CHATBOT FLOW - DeliveryFlow WhatsApp Bot
// ============================================

const { NlpManager } = require('node-nlp');

// Configurações do negócio
const CONFIG = {
  horarioFuncionamento: {
    abertura: '18:00',
    fechamento: '23:00',
    diasFuncionamento: [0, 1, 2, 3, 4, 5, 6] // 0=Dom, 6=Sab
  },
  taxaEntrega: 5.00,
  mensagens: {
    foraDHorario: '🕐 Desculpe, estamos fechados no momento!\n\nNosso horário de funcionamento:\n📅 Todos os dias\n⏰ 18:00 às 23:00\n\nVolte nesse horário e teremos o prazer de atendê-lo! 😊',
    boasVindas: '👋 Olá! Bem-vindo ao *DeliveryFlow*!\n\nComo posso ajudar você hoje?\n\n1️⃣ Ver cardápio 📋\n2️⃣ Fazer pedido 🛒\n3️⃣ Falar com atendente 👤\n\nDigite o número ou escreva o que deseja!',
    naoEntendi: '😅 Desculpe, não entendi direito.\n\nVocê pode:\n\n🟢 Tentar de novo\n🟠 Falar com atendente\n\nDigite *atendente* para falar com uma pessoa.',
    pedidoCancelado: '❌ Pedido cancelado!\n\nSe precisar de algo, estou aqui! 😊',
    aguardandoAtendente: '👤 Transferindo para atendente humano...\n\nAguarde um momento, você será atendido em breve!'
  }
};

// Estados possíveis da conversa
const ESTADOS = {
  INICIO: 'inicio',
  COLETANDO_NOME: 'coletando_nome',
  AGUARDANDO_OPCAO: 'aguardando_opcao',
  MOSTRANDO_CARDAPIO: 'mostrando_cardapio',
  COLETANDO_PRODUTOS: 'coletando_produtos',
  COLETANDO_OBSERVACAO: 'coletando_observacao',
  ESCOLHENDO_MODO: 'escolhendo_modo',
  COLETANDO_ENDERECO: 'coletando_endereco',
  CONFIRMANDO_PEDIDO: 'confirmando_pedido',
  ESCOLHENDO_PAGAMENTO: 'escolhendo_pagamento',
  PROCESSANDO_PIX: 'processando_pix',
  PROCESSANDO_DINHEIRO: 'processando_dinheiro',
  FINALIZADO: 'finalizado',
  AGUARDANDO_ATENDENTE: 'aguardando_atendente'
};

// Sessões ativas (em memória - poderia ser Redis em produção)
const sessoes = new Map();

class ChatbotFlow {
  constructor(produtosModel, pedidosModel, io, config = null) {
    this.Produto = produtosModel;
    this.Pedido = pedidosModel;
    this.io = io;
    this.config = config || CONFIG; // Usar config passada ou padrão
    this.manager = new NlpManager({ languages: ['pt'], forceNER: true });
    this.treinarNLP();
  }

  treinarNLP() {
    // Intents para identificar intenção
    this.manager.addDocument('pt', 'quero ver o cardápio', 'ver_cardapio');
    this.manager.addDocument('pt', 'mostrar cardápio', 'ver_cardapio');
    this.manager.addDocument('pt', 'menu', 'ver_cardapio');
    this.manager.addDocument('pt', 'o que tem', 'ver_cardapio');
    this.manager.addDocument('pt', 'produtos', 'ver_cardapio');

    this.manager.addDocument('pt', 'quero fazer um pedido', 'fazer_pedido');
    this.manager.addDocument('pt', 'pedir', 'fazer_pedido');
    this.manager.addDocument('pt', 'quero pedir', 'fazer_pedido');
    this.manager.addDocument('pt', 'comprar', 'fazer_pedido');

    this.manager.addDocument('pt', 'falar com atendente', 'atendente');
    this.manager.addDocument('pt', 'atendente', 'atendente');
    this.manager.addDocument('pt', 'falar com humano', 'atendente');
    this.manager.addDocument('pt', 'falar com alguém', 'atendente');

    this.manager.addDocument('pt', 'cancelar', 'cancelar');
    this.manager.addDocument('pt', 'desistir', 'cancelar');
    this.manager.addDocument('pt', 'parar', 'cancelar');

    this.manager.addDocument('pt', 'editar', 'editar');
    this.manager.addDocument('pt', 'mudar', 'editar');
    this.manager.addDocument('pt', 'alterar', 'editar');

    this.manager.addDocument('pt', 'confirmar', 'confirmar');
    this.manager.addDocument('pt', 'sim', 'confirmar');
    this.manager.addDocument('pt', 'está certo', 'confirmar');
    this.manager.addDocument('pt', 'ok', 'confirmar');

    // Modo de entrega
    this.manager.addDocument('pt', 'entrega', 'entrega');
    this.manager.addDocument('pt', 'delivery', 'entrega');
    this.manager.addDocument('pt', 'entregar', 'entrega');
    this.manager.addDocument('pt', 'levar', 'entrega');

    this.manager.addDocument('pt', 'retirada', 'retirada');
    this.manager.addDocument('pt', 'buscar', 'retirada');
    this.manager.addDocument('pt', 'pegar', 'retirada');
    this.manager.addDocument('pt', 'retirar', 'retirada');

    // Pagamento
    this.manager.addDocument('pt', 'pix', 'pix');
    this.manager.addDocument('pt', 'transferência', 'pix');

    this.manager.addDocument('pt', 'dinheiro', 'dinheiro');
    this.manager.addDocument('pt', 'em dinheiro', 'dinheiro');
    this.manager.addDocument('pt', 'cash', 'dinheiro');

    this.manager.addDocument('pt', 'cartão', 'cartao');
    this.manager.addDocument('pt', 'débito', 'cartao');
    this.manager.addDocument('pt', 'crédito', 'cartao');

    this.manager.train();
  }

  // Verifica horário comercial
  verificarHorario() {
    // LOG DEBUG
    console.log('[DEBUG] Verificando horario do bot');
    var agora = new Date();
    var dia = agora.getDay();
    var hora = agora.getHours();
    var minuto = agora.getMinutes();
    var horaAtual = hora + minuto / 60;

    var horario = this.config.horarioFuncionamento || {};
    var horaAberturaStr = horario.horaAbertura || '18:00';
    var horaFechamentoStr = horario.horaFechamento || '23:00';
    var diasFuncionamento = Array.isArray(horario.diasFuncionamento) ? horario.diasFuncionamento : ['segunda','terca','quarta','quinta','sexta','sabado','domingo'];
    // Corrigir: converter números para strings
    const diasNomes = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
    diasFuncionamento = diasFuncionamento.map(d => {
      if (typeof d === 'number') return diasNomes[d] || d;
      return d;
    });

    var horaAbreArr = horaAberturaStr.split(':');
    var horaFechaArr = horaFechamentoStr.split(':');
    var horaAbre = horaAbreArr.length === 2 ? horaAbreArr[0] : '18';
    var minAbre = horaAbreArr.length === 2 ? horaAbreArr[1] : '00';
    var horaFecha = horaFechaArr.length === 2 ? horaFechaArr[0] : '23';
    var minFecha = horaFechaArr.length === 2 ? horaFechaArr[1] : '00';
    var horaAbertura = parseInt(horaAbre) + parseInt(minAbre) / 60;
    var horaFechamento = parseInt(horaFecha) + parseInt(minFecha) / 60;

    var mapaDias = {
      domingo: 0,
      segunda: 1,
      terca: 2,
      quarta: 3,
      quinta: 4,
      sexta: 5,
      sabado: 6
    };

    console.log('[DEBUG] Agora:', agora.toISOString(), '| Dia:', dia, '| Hora:', hora, ':', minuto);
    console.log('[DEBUG] Configuracao:', { horaAberturaStr: horaAberturaStr, horaFechamentoStr: horaFechamentoStr, diasFuncionamento: diasFuncionamento });
    console.log('[DEBUG] HoraAbertura:', horaAbertura, '| HoraFechamento:', horaFechamento, '| HoraAtual:', horaAtual);

    var diaFunciona = diasFuncionamento.some(function(diaStr) { return mapaDias[diaStr] === dia; });
    console.log('[DEBUG] Dia funciona?', diaFunciona);
    var dentroHorario = horaAtual >= horaAbertura && horaAtual < horaFechamento;
    console.log('[DEBUG] Dentro do horario?', dentroHorario);

    return diaFunciona && dentroHorario;
  }

  // Obter ou criar sessão
  obterSessao(telefone) {
    if (!sessoes.has(telefone)) {
      sessoes.set(telefone, {
        telefone,
        estado: ESTADOS.INICIO,
        pedido: {
          produtos: [],
          observacao: '',
          modoEntrega: '',
          endereco: '',
          pagamento: '',
          troco: 0,
          total: 0
        },
        historico: [],
        criadoEm: new Date()
      });
    }
    return sessoes.get(telefone);
  }

  // Salvar mensagem no histórico
  salvarHistorico(sessao, role, mensagem) {
    sessao.historico.push({
      role, // 'user' ou 'bot'
      mensagem,
      timestamp: new Date()
    });
  }

  // Atualizar estado da sessão
  atualizarEstado(sessao, novoEstado) {
  console.log('[DEBUG] Estado:', sessao.telefone, sessao.estado, '->', novoEstado);
    sessao.estado = novoEstado;
  }

  // Limpar sessão
  limparSessao(telefone) {
  sessoes.delete(telefone);
  console.log('[DEBUG] Sessao limpa:', telefone);
  }

  // Processar mensagem recebida
  async processarMensagem(telefone, mensagem) {
    const sessao = this.obterSessao(telefone);
    this.salvarHistorico(sessao, 'user', mensagem);

  console.log('[DEBUG] Mensagem recebida:', telefone, sessao.estado, mensagem);

    // Verificar comandos globais
    const nlp = await this.manager.process('pt', mensagem.toLowerCase());

    // Sempre mostrar cardápio se pedir
    if (nlp.intent === 'ver_cardapio' || mensagem.trim().toLowerCase() === 'cardápio') {
      return await this.mostrarCardapio(sessao);
    }

    // Cancelar pedido
    if (nlp.intent === 'cancelar' && sessao.estado !== ESTADOS.INICIO) {
      this.limparSessao(telefone);
      return this.config.mensagens.pedidoCancelado;
    }

    // Atendente humano (NÃO transfere se estiver coletando observação)
    if (nlp.intent === 'atendente' && sessao.estado !== ESTADOS.COLETANDO_OBSERVACAO) {
      this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_ATENDENTE);
      sessao.pedido.humanTakeover = true;
      return this.config.mensagens.aguardandoAtendente;
    }

    // Processar baseado no estado atual
    switch (sessao.estado) {
      case ESTADOS.INICIO:
        return await this.handleInicio(sessao, mensagem, nlp);
      case ESTADOS.COLETANDO_NOME:
        return await this.handleColetaNome(sessao, mensagem);
      case ESTADOS.AGUARDANDO_OPCAO:
        return await this.handleEscolhaOpcao(sessao, mensagem, nlp);
      case ESTADOS.MOSTRANDO_CARDAPIO:
        return await this.handleColetaProdutos(sessao, mensagem, nlp);
      case ESTADOS.COLETANDO_PRODUTOS:
        return await this.handleColetaProdutos(sessao, mensagem, nlp);
      case ESTADOS.COLETANDO_OBSERVACAO:
        return await this.handleColetaObservacao(sessao, mensagem);
      case ESTADOS.ESCOLHENDO_MODO:
        return await this.handleEscolhaModo(sessao, mensagem, nlp);
      case ESTADOS.COLETANDO_ENDERECO:
        return await this.handleColetaEndereco(sessao, mensagem);
      case ESTADOS.CONFIRMANDO_PEDIDO:
        return await this.handleConfirmacao(sessao, mensagem, nlp);
      case ESTADOS.ESCOLHENDO_PAGAMENTO:
        return await this.handleEscolhaPagamento(sessao, mensagem, nlp);
      case ESTADOS.PROCESSANDO_PIX:
        return await this.handlePix(sessao, mensagem);
      case ESTADOS.PROCESSANDO_DINHEIRO:
        return await this.handleDinheiro(sessao, mensagem);
      case ESTADOS.AGUARDANDO_ATENDENTE:
        // Mensagens neste estado vão direto para o painel
        return '✅ Mensagem enviada para o atendente. Aguarde um momento!';
      default:
        return CONFIG.mensagens.naoEntendi;
    }
  }

  // Handler: Início da conversa
  async handleInicio(sessao, mensagem, nlp) {
    // Verificar horário
    if (!this.verificarHorario()) {
      this.limparSessao(sessao.telefone);
      return this.config.mensagens.foraDHorario;
    }

    // Verificar se o cliente já existe no banco
    if (this.Cliente) {
      try {
        const clienteExistente = await this.Cliente.findOne({ telefone: sessao.telefone });
        
        if (!clienteExistente) {
          // Cliente novo - pedir nome
          this.atualizarEstado(sessao, ESTADOS.COLETANDO_NOME);
          const resposta = '👋 Olá! Vejo que é sua primeira vez aqui!\n\n😊 Para começarmos, qual é o seu nome?';
          this.salvarHistorico(sessao, 'bot', resposta);
          return resposta;
        } else {
          // Cliente existente - salvar nome na sessão
          sessao.nomeCliente = clienteExistente.nome;
        }
      } catch (error) {
        console.error('❌ Erro ao verificar cliente:', error);
      }
    }

    // Boas-vindas
    this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_OPCAO);
    const nomeCliente = sessao.nomeCliente || '';
    const saudacao = nomeCliente ? `👋 Olá, *${nomeCliente}*! Bem-vindo de volta ao *DeliveryFlow*!` : '👋 Olá! Bem-vindo ao *DeliveryFlow*!';
    const resposta = `${saudacao}\n\nComo posso ajudar você hoje?\n\n1️⃣ Ver cardápio 📋\n2️⃣ Fazer pedido 🛒\n3️⃣ Falar com atendente 👤\n\nDigite o número ou escreva o que deseja!`;
    this.salvarHistorico(sessao, 'bot', resposta);
    return resposta;
  }

  // Handler: Escolha de opção inicial
  async handleEscolhaOpcao(sessao, mensagem, nlp) {
    const msgLower = mensagem.toLowerCase().trim();

    // Opção 1 ou "cardápio"
    if (msgLower === '1' || nlp.intent === 'ver_cardapio') {
      return await this.mostrarCardapio(sessao);
    }

    // Opção 2 ou "pedido"
    if (msgLower === '2' || nlp.intent === 'fazer_pedido') {
      return await this.iniciarPedido(sessao);
    }

    // Opção 3 ou "atendente"
    if (msgLower === '3' || nlp.intent === 'atendente') {
      this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_ATENDENTE);
      sessao.pedido.humanTakeover = true;
      return this.config.mensagens.aguardandoAtendente;
    }

    // Entrada livre - tentar identificar intenção
    if (nlp.intent && nlp.score > 0.7) {
      if (nlp.intent === 'ver_cardapio') {
        return await this.mostrarCardapio(sessao);
      }
      if (nlp.intent === 'fazer_pedido') {
        return await this.iniciarPedido(sessao);
      }
    }

    // Se parece um pedido de produto, já inicia coleta de produtos
    const produtosIdentificados = await this.handleColetaProdutos(sessao, mensagem, nlp);
    // Se identificou produto, inicia fluxo de pedido
    if (produtosIdentificados && typeof produtosIdentificados === 'string' && produtosIdentificados.startsWith('✅ Adicionado')) {
  this.atualizarEstado(sessao, ESTADOS.COLETANDO_PRODUTOS);
      return produtosIdentificados;
    }

    return this.config.mensagens.naoEntendi;
  }

  // Mostrar cardápio do banco de dados
  async mostrarCardapio(sessao) {
    try {
      const produtos = await this.Produto.find({ ativo: true }).sort({ categoria: 1, preco: 1 });
      
      if (produtos.length === 0) {
        return '😔 Desculpe, não temos produtos disponíveis no momento.';
      }

      let mensagem = '📋 *NOSSO CARDÁPIO*\n\n';
      
      // Agrupar por categoria
      const categorias = {};
      produtos.forEach(p => {
        if (!categorias[p.categoria]) {
          categorias[p.categoria] = [];
        }
        categorias[p.categoria].push(p);
      });

      // Formatar por categoria
      Object.keys(categorias).forEach(cat => {
        mensagem += `🔸 *${cat}*\n`;
        categorias[cat].forEach(p => {
          mensagem += `  ${p.nome} - R$ ${p.preco.toFixed(2)}\n`;
          if (p.descricao) {
            mensagem += `     _${p.descricao}_\n`;
          }
        });
        mensagem += '\n';
      });

      mensagem += '\n💬 Para fazer um pedido, digite:\n';
      mensagem += '_"Quero 1 Pizza Margherita"_\n';
      mensagem += 'ou apenas\n';
      mensagem += '_"fazer pedido"_';

      this.atualizarEstado(sessao, ESTADOS.MOSTRANDO_CARDAPIO);
      this.salvarHistorico(sessao, 'bot', mensagem);
      return mensagem;
    } catch (error) {
      console.error('❌ Erro ao carregar cardápio:', error);
      return '😔 Desculpe, ocorreu um erro ao carregar o cardápio. Tente novamente.';
    }
  }

  // Iniciar coleta de pedido
  async iniciarPedido(sessao) {
    this.atualizarEstado(sessao, ESTADOS.COLETANDO_PRODUTOS);
    const msg = '🛒 *FAZER PEDIDO*\n\nDigite os produtos que deseja!\n\nExemplos:\n• _1 Pizza Margherita_\n• _2 X-Burger Bacon_\n• _1 Coca-Cola 2L_\n\nOu digite tudo de uma vez:\n_"Quero uma pizza calabresa pra entregar na Rua A, pago no Pix"_\n\n💡 Quando terminar, digite *pronto*';
    this.salvarHistorico(sessao, 'bot', msg);
    return msg;
  }

  // Handler: Coleta de nome (primeiro contato)
  async handleColetaNome(sessao, mensagem) {
    const nome = mensagem.trim();
    
    if (nome.length < 2) {
      return '😅 Por favor, digite seu nome completo para continuarmos!';
    }

    // Salvar cliente no banco
    if (this.Cliente) {
      try {
        const novoCliente = new this.Cliente({
          telefone: sessao.telefone,
          nome: nome,
          ultimoPedido: new Date()
        });
        await novoCliente.save();
        console.log(`✅ Cliente cadastrado: ${nome} (${sessao.telefone})`);
        
        // Salvar na sessão
        sessao.nomeCliente = nome;
      } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
      }
    }

    // Continuar para boas-vindas
    this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_OPCAO);
    const resposta = `✅ Prazer em conhecê-lo, *${nome}*!\n\n👋 Bem-vindo ao *DeliveryFlow*!\n\nComo posso ajudar você hoje?\n\n1️⃣ Ver cardápio 📋\n2️⃣ Fazer pedido 🛒\n3️⃣ Falar com atendente 👤\n\nDigite o número ou escreva o que deseja!`;
    this.salvarHistorico(sessao, 'bot', resposta);
    return resposta;
  }

  // Continua no próximo arquivo devido ao tamanho...
  // (Vou criar as partes restantes)
}

module.exports = { ChatbotFlow, ESTADOS, CONFIG, sessoes };

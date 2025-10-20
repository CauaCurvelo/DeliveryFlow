const { NlpManager } = require('node-nlp');

const CONFIG = {
  horarioFuncionamento: {
    abertura: '18:00',
    fechamento: '23:00',
    diasFuncionamento: [0, 1, 2, 3, 4, 5, 6]
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

const sessoes = new Map();

class ChatbotFlow {
  constructor(produtosModel, pedidosModel, io, config = null) {
    this.Produto = produtosModel;
    this.Pedido = pedidosModel;
    this.io = io;
    this.config = config || CONFIG;
    this.manager = new NlpManager({ languages: ['pt'], forceNER: true });
    this.treinarNLP();
  }

  treinarNLP() {
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

    this.manager.addDocument('pt', 'entrega', 'entrega');
    this.manager.addDocument('pt', 'delivery', 'entrega');
    this.manager.addDocument('pt', 'entregar', 'entrega');
    this.manager.addDocument('pt', 'levar', 'entrega');

    this.manager.addDocument('pt', 'retirada', 'retirada');
    this.manager.addDocument('pt', 'buscar', 'retirada');
    this.manager.addDocument('pt', 'pegar', 'retirada');
    this.manager.addDocument('pt', 'retirar', 'retirada');

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

  verificarHorario() {
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

  salvarHistorico(sessao, role, mensagem) {
    sessao.historico.push({
      role,
      mensagem,
      timestamp: new Date()
    });
  }

  atualizarEstado(sessao, novoEstado) {
    console.log('[DEBUG] Estado:', sessao.telefone, sessao.estado, '->', novoEstado);
    sessao.estado = novoEstado;
  }

  limparSessao(telefone) {
    sessoes.delete(telefone);
    console.log('[DEBUG] Sessao limpa:', telefone);
  }

  async processarMensagem(telefone, mensagem) {
    const sessao = this.obterSessao(telefone);
    this.salvarHistorico(sessao, 'user', mensagem);

    console.log('[DEBUG] Mensagem recebida:', telefone, sessao.estado, mensagem);

    const nlp = await this.manager.process('pt', mensagem.toLowerCase());

    if (nlp.intent === 'ver_cardapio' || mensagem.trim().toLowerCase() === 'cardápio') {
      return await this.mostrarCardapio(sessao);
    }

    if (nlp.intent === 'cancelar' && sessao.estado !== ESTADOS.INICIO) {
      this.limparSessao(telefone);
      return this.config.mensagens.pedidoCancelado;
    }

    if (nlp.intent === 'atendente' && sessao.estado !== ESTADOS.COLETANDO_OBSERVACAO) {
      this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_ATENDENTE);
      sessao.pedido.humanTakeover = true;
      return this.config.mensagens.aguardandoAtendente;
    }

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
        return '✅ Mensagem enviada para o atendente. Aguarde um momento!';
      default:
        return CONFIG.mensagens.naoEntendi;
    }
  }

  async handleInicio(sessao, mensagem, nlp) {
    if (!this.verificarHorario()) {
      this.limparSessao(sessao.telefone);
      return this.config.mensagens.foraDHorario;
    }

    if (this.Cliente) {
      try {
        const clienteExistente = await this.Cliente.findOne({ telefone: sessao.telefone });
        
        if (!clienteExistente) {
          this.atualizarEstado(sessao, ESTADOS.COLETANDO_NOME);
          const resposta = '👋 Olá! Vejo que é sua primeira vez aqui!\n\n😊 Para começarmos, qual é o seu nome?';
          this.salvarHistorico(sessao, 'bot', resposta);
          return resposta;
        } else {
          sessao.nomeCliente = clienteExistente.nome;
        }
      } catch (error) {
        console.error('❌ Erro ao verificar cliente:', error);
      }
    }

    this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_OPCAO);
    const nomeCliente = sessao.nomeCliente || '';
    const saudacao = nomeCliente ? `👋 Olá, *${nomeCliente}*! Bem-vindo de volta ao *DeliveryFlow*!` : '👋 Olá! Bem-vindo ao *DeliveryFlow*!';
    const resposta = `${saudacao}\n\nComo posso ajudar você hoje?\n\n1️⃣ Ver cardápio 📋\n2️⃣ Fazer pedido 🛒\n3️⃣ Falar com atendente 👤\n\nDigite o número ou escreva o que deseja!`;
    this.salvarHistorico(sessao, 'bot', resposta);
    return resposta;
  }

  async handleEscolhaOpcao(sessao, mensagem, nlp) {
    const msgLower = mensagem.toLowerCase().trim();

    if (msgLower === '1' || nlp.intent === 'ver_cardapio') {
      return await this.mostrarCardapio(sessao);
    }

    if (msgLower === '2' || nlp.intent === 'fazer_pedido') {
      return await this.iniciarPedido(sessao);
    }

    if (msgLower === '3' || nlp.intent === 'atendente') {
      this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_ATENDENTE);
      sessao.pedido.humanTakeover = true;
      return this.config.mensagens.aguardandoAtendente;
    }

    if (nlp.intent && nlp.score > 0.7) {
      if (nlp.intent === 'ver_cardapio') {
        return await this.mostrarCardapio(sessao);
      }
      if (nlp.intent === 'fazer_pedido') {
        return await this.iniciarPedido(sessao);
      }
    }

    const produtosIdentificados = await this.handleColetaProdutos(sessao, mensagem, nlp);
    if (produtosIdentificados && typeof produtosIdentificados === 'string' && produtosIdentificados.startsWith('✅ Adicionado')) {
      this.atualizarEstado(sessao, ESTADOS.COLETANDO_PRODUTOS);
      return produtosIdentificados;
    }

    return this.config.mensagens.naoEntendi;
  }

  async mostrarCardapio(sessao) {
    try {
      const produtos = await this.Produto.find({ ativo: true }).sort({ categoria: 1, preco: 1 });
      
      if (produtos.length === 0) {
        return '😔 Desculpe, não temos produtos disponíveis no momento.';
      }

      let mensagem = '📋 *NOSSO CARDÁPIO*\n\n';
      
      const categorias = {};
      produtos.forEach(p => {
        if (!categorias[p.categoria]) {
          categorias[p.categoria] = [];
        }
        categorias[p.categoria].push(p);
      });

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

  async iniciarPedido(sessao) {
    this.atualizarEstado(sessao, ESTADOS.COLETANDO_PRODUTOS);
    const msg = '🛒 *FAZER PEDIDO*\n\nDigite os produtos que deseja!\n\nExemplos:\n• _1 Pizza Margherita_\n• _2 X-Burger Bacon_\n• _1 Coca-Cola 2L_\n\nOu digite tudo de uma vez:\n_"Quero uma pizza calabresa pra entregar na Rua A, pago no Pix"_\n\n💡 Quando terminar, digite *pronto*';
    this.salvarHistorico(sessao, 'bot', msg);
    return msg;
  }

  async handleColetaNome(sessao, mensagem) {
    const nome = mensagem.trim();
    
    if (nome.length < 2) {
      return '😅 Por favor, digite seu nome completo para continuarmos!';
    }

    if (this.Cliente) {
      try {
        const novoCliente = new this.Cliente({
          telefone: sessao.telefone,
          nome: nome,
          ultimoPedido: new Date()
        });
        await novoCliente.save();
        console.log(`✅ Cliente cadastrado: ${nome} (${sessao.telefone})`);
        
        sessao.nomeCliente = nome;
      } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
      }
    }

    this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_OPCAO);
    const resposta = `✅ Prazer em conhecê-lo, *${nome}*!\n\n👋 Bem-vindo ao *DeliveryFlow*!\n\nComo posso ajudar você hoje?\n\n1️⃣ Ver cardápio 📋\n2️⃣ Fazer pedido 🛒\n3️⃣ Falar com atendente 👤\n\nDigite o número ou escreva o que deseja!`;
    this.salvarHistorico(sessao, 'bot', resposta);
    return resposta;
  }
}

module.exports = { ChatbotFlow, ESTADOS, CONFIG, sessoes };

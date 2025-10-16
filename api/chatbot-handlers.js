// ============================================
// CHATBOT FLOW - Parte 2: Handlers de Coleta
// ============================================

// Continuação da classe ChatbotFlow

// Handler: Coleta de produtos com entrada livre
async function handleColetaProdutos(sessao, mensagem, nlp) {
  const msgLower = mensagem.toLowerCase().trim();

  // Se pedir cardápio, mostrar cardápio
  if (nlp.intent === 'ver_cardapio' || msgLower === 'cardápio') {
    return await this.mostrarCardapio(sessao);
  }

  // Se digitar "pronto", ir para próximo passo
    if (msgLower === 'pronto' || msgLower === 'é isso' || msgLower === 'só isso') {
      if (sessao.pedido.produtos.length === 0) {
        return '😅 Você ainda não adicionou nenhum produto!\n\nDigite o que deseja, por exemplo:\n_"1 Pizza Margherita"_';
      }
      // Importa ESTADOS do chatbot-flow.js
      const { ESTADOS } = require('./chatbot-flow');
      return await this.perguntarObservacao(sessao, ESTADOS);
    }


  // Tentar identificar produtos na mensagem
  const produtosIdentificados = await this.identificarProdutos(mensagem);
  const produtosValidos = produtosIdentificados.filter(p => p.nome && p.nome.trim() !== '' && p.preco && p.preco > 0);
  const produtosInvalidos = produtosIdentificados.filter(p => !p.nome || !p.preco || p.preco === 0);

  if (produtosValidos.length > 0) {
    // Adicionar produtos válidos ao pedido, somando quantidades se já existe
    produtosValidos.forEach(p => {
      // Validação: quantidade mínima 1, máxima 99
      if (typeof p.quantidade !== 'number' || isNaN(p.quantidade) || p.quantidade < 1) p.quantidade = 1;
      if (p.quantidade > 99) p.quantidade = 99;
      const idx = sessao.pedido.produtos.findIndex(prod => prod.produtoId && prod.produtoId.toString() === p.produtoId.toString());
      if (idx !== -1) {
        sessao.pedido.produtos[idx].quantidade += p.quantidade;
        // Se passar de 99, limita
        if (sessao.pedido.produtos[idx].quantidade > 99) sessao.pedido.produtos[idx].quantidade = 99;
      } else {
        sessao.pedido.produtos.push({ ...p });
      }
    });

    let resposta = '✅ Adicionado:\n';
    produtosValidos.forEach(p => {
      resposta += `  ${p.quantidade}x ${p.nome} - R$ ${(p.preco * p.quantidade).toFixed(2)}\n`;
    });
    resposta += '\n📝 Seu pedido até agora:\n';
    sessao.pedido.produtos.forEach(p => {
      resposta += `  ${p.quantidade}x ${p.nome}\n`;
    });
    if (produtosInvalidos.length > 0) {
      resposta += '\n❌ Não consegui identificar:\n';
      produtosInvalidos.forEach(p => {
        resposta += `  ${p.quantidade || 1}x ${p.nome || 'Produto desconhecido'}\n`;
      });
      resposta += '\nTente digitar o nome completo ou veja o *cardápio*.';
    }
    resposta += '\n💬 Digite mais produtos ou *pronto* para continuar.';
    this.salvarHistorico(sessao, 'bot', resposta);
    return resposta;
  }

  // Tentar entrada livre completa (com endereço, pagamento, etc)
  const entradaCompleta = await this.analisarEntradaLivre(sessao, mensagem, nlp);
  if (entradaCompleta) {
    return entradaCompleta;
  }

  // Não conseguiu identificar produto
  return '🤔 Não consegui identificar esse produto.\n\nTente escrever o nome completo, como:\n_"Pizza Margherita"_\n_"X-Burger Bacon"_\n\nOu digite *cardápio* para ver as opções.';
}

// Identificar produtos na mensagem
async function identificarProdutos(mensagem) {
  try {
    const Fuse = require('fuse.js');
    const mongoose = require('mongoose');
    const isMongoConnected = mongoose.connection.readyState === 1;
    
    let produtos = [];
    if (isMongoConnected) {
      produtos = await this.Produto.find({ ativo: true });
    } else {
      // Fallback to memory
      produtos = [
        { _id: 'P1', nome: 'Pizza Margherita G', preco: 45.00, ativo: true },
        { _id: 'P2', nome: 'X-Burger Bacon', preco: 28.00, ativo: true },
        { _id: 'P3', nome: 'Salada Caesar', preco: 32.00, ativo: true },
        { _id: 'P4', nome: 'Pasta Carbonara', preco: 38.00, ativo: true },
        { _id: 'P5', nome: 'Refrigerante 2L', preco: 10.00, ativo: true },
        { _id: 'P6', nome: 'Batata Frita G', preco: 18.00, ativo: true },
        { _id: 'P7', nome: 'Tiramisu', preco: 15.00, ativo: true },
        { _id: 'P8', nome: 'Pizza Calabresa G', preco: 48.00, ativo: true },
        { _id: 'P9', nome: 'Suco Natural 500ml', preco: 8.00, ativo: true },
        { _id: 'P10', nome: 'Suco de Laranja', preco: 8.00, ativo: true },
        { _id: 'P11', nome: 'Suco de Limão', preco: 7.00, ativo: true },
        { _id: 'P12', nome: 'Água Mineral', preco: 3.00, ativo: true },
      ].filter(p => p.ativo);
    }

    console.log('[DEBUG] identificarProdutos - Total produtos no banco:', produtos.length);
    console.log('[DEBUG] identificarProdutos - Mensagem original:', mensagem);

    const identificados = [];
    const msgLower = mensagem.toLowerCase();

    // Normalizar nomes dos produtos APÓS carregar do banco
    const produtosNormalizados = produtos.map(p => ({
      _id: p._id,
      nomeOriginal: p.nome,
      nome: p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      preco: p.preco
    }));

    console.log('[DEBUG] identificarProdutos - Produtos normalizados:', produtosNormalizados.map(p => p.nome));

    // Fuzzy search setup com threshold MAIS TOLERANTE
    const fuse = new Fuse(produtosNormalizados, {
      keys: ['nome'],
      threshold: 0.6, // Aumentado de 0.4 para 0.6 (mais tolerante)
      minMatchCharLength: 3,
      ignoreLocation: true,
      includeScore: true,
      distance: 100
    });

    // Dividir mensagem por ' e ', ',' ou múltiplos espaços
    const partes = msgLower.split(/\s+e\s+|,\s*|\s{2,}/gi).map(p => p.trim()).filter(Boolean);
    console.log('[DEBUG] identificarProdutos - Partes da mensagem:', partes);

    // Novo parser: junta números isolados à próxima parte
    let partesCorrigidas = [];
    for (let i = 0; i < partes.length; i++) {
      if (/^\d+$/.test(partes[i]) && i < partes.length - 1) {
        // Se parte é só número, junta com próxima
        partesCorrigidas.push(partes[i] + ' ' + partes[i + 1]);
        i++; // pula próxima
      } else if (!/^\d+$/.test(partes[i])) {
        partesCorrigidas.push(partes[i]);
      }
      // Se for só número e última, ignora
    }
    console.log('[DEBUG] identificarProdutos - Partes corrigidas:', partesCorrigidas);

    // Para cada parte, tentar encontrar quantidade + produto
    const regex = /^(\d+)\s*x?\s*(.+)$/i;
    partesCorrigidas.forEach(parte => {
      let match = regex.exec(parte);
      let quantidade = 1;
      let nomeProduto = parte;
      
      if (match) {
        quantidade = parseInt(match[1]);
        nomeProduto = match[2].trim();
      }

      // Normalizar nome do produto buscado
      const nomeProdutoNorm = nomeProduto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      console.log('[DEBUG] identificarProdutos - Buscando:', nomeProdutoNorm, '| Quantidade:', quantidade);

      const results = fuse.search(nomeProdutoNorm);
      console.log('[DEBUG] identificarProdutos - Resultados Fuse:', results.map(r => ({ nome: r.item.nomeOriginal, score: r.score })));

      if (results.length > 0 && results[0].score < 0.7) {
        const produtoEncontrado = results[0].item;
        console.log('[DEBUG] identificarProdutos - Produto encontrado:', produtoEncontrado.nomeOriginal, '| Score:', results[0].score);
        identificados.push({
          produtoId: produtoEncontrado._id,
          nome: produtoEncontrado.nomeOriginal,
          quantidade,
          preco: produtoEncontrado.preco
        });
      } else {
        console.log('[DEBUG] identificarProdutos - Produto NÃO encontrado:', nomeProdutoNorm);
        // Produto não identificado
        identificados.push({
          produtoId: '',
          nome: nomeProduto,
          quantidade,
          preco: 0
        });
      }
    });

    console.log('[DEBUG] identificarProdutos - Produtos identificados:', identificados);
    return identificados;
  } catch (error) {
    console.error('❌ Erro ao identificar produtos:', error);
    return [];
  }
}

// Analisar entrada livre completa
async function analisarEntradaLivre(sessao, mensagem, nlp) {
  const msgLower = mensagem.toLowerCase();
  
  // Verificar se menciona endereço
  const enderecoMatch = msgLower.match(/(?:rua|av|avenida|travessa)\s+(.+?)(?=\s+pag|$)/i);
  if (enderecoMatch) {
    sessao.pedido.endereco = enderecoMatch[0];
    sessao.pedido.modoEntrega = 'delivery';
  }

  // Verificar modo de entrega
  if (nlp.intent === 'entrega' || msgLower.includes('entregar') || msgLower.includes('delivery')) {
    sessao.pedido.modoEntrega = 'delivery';
  }
  if (nlp.intent === 'retirada' || msgLower.includes('retirar') || msgLower.includes('buscar')) {
    sessao.pedido.modoEntrega = 'retirada';
  }

  // Verificar pagamento
  if (nlp.intent === 'pix' || msgLower.includes('pix')) {
    sessao.pedido.pagamento = 'pix';
  }
  if (nlp.intent === 'dinheiro' || msgLower.includes('dinheiro')) {
    sessao.pedido.pagamento = 'dinheiro';
  }
  if (nlp.intent === 'cartao' || msgLower.includes('cartão') || msgLower.includes('cartao')) {
    sessao.pedido.pagamento = 'cartao';
  }

  // Se identificou tudo, pular etapas
  if (sessao.pedido.produtos.length > 0 && 
      sessao.pedido.modoEntrega && 
      sessao.pedido.pagamento) {
    
    if (sessao.pedido.modoEntrega === 'delivery' && !sessao.pedido.endereco) {
      // Falta só o endereço
      return await this.perguntarEndereco(sessao);
    }

    // Tem tudo, ir para confirmação
    return await this.mostrarConfirmacao(sessao);
  }

  return null;
}

// Perguntar observação
async function perguntarObservacao(sessao) {
  // Recebe ESTADOS como segundo argumento
  const ESTADOS = arguments[1];
  this.atualizarEstado(sessao, ESTADOS.COLETANDO_OBSERVACAO);
  const msg = '📝 Alguma observação sobre o pedido?\n\nPor exemplo:\n• _Sem cebola_\n• _Bem passado_\n• _Caprichar no molho_\n\nOu digite *não* para pular.';
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Coleta de observação
async function handleColetaObservacao(sessao, mensagem) {
  const msgLower = mensagem.toLowerCase().trim();

  // Palavras-chave para atendimento humano (apenas se a mensagem for EXATAMENTE igual)
  const keywords = [
    'atendente',
    'humano',
    'pessoa',
    'falar com atendente',
    'falar com humano',
    'quero falar com alguém'
  ];
  const pedeAtendente = keywords.includes(msgLower);

  if (pedeAtendente) {
    // Importa ESTADOS do chatbot-flow.js
    const { ESTADOS, CONFIG } = require('./chatbot-flow');
    this.atualizarEstado(sessao, ESTADOS.AGUARDANDO_ATENDENTE);
    sessao.pedido.humanTakeover = true;
    return CONFIG.mensagens.aguardandoAtendente;
  }

  if (msgLower !== 'não' && msgLower !== 'nao' && msgLower !== 'sem observação' && msgLower !== 'sem observacao') {
    sessao.pedido.observacao = mensagem;
  }

  return await this.perguntarModoEntrega(sessao);
}

// Perguntar modo de entrega
async function perguntarModoEntrega(sessao) {
  // Importa ESTADOS do chatbot-flow.js
  const { ESTADOS } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.ESCOLHENDO_MODO);
  const msg = '🚗 Como prefere receber?\n\n1️⃣ *Entrega* (delivery) 🏠\n2️⃣ *Retirada* (buscar no local) 🏃\n\nDigite *1* ou *2*';
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Escolha do modo de entrega
async function handleEscolhaModo(sessao, mensagem, nlp) {
  const msgLower = mensagem.toLowerCase().trim();

  if (msgLower === '1' || nlp.intent === 'entrega' || msgLower.includes('entrega') || msgLower.includes('delivery')) {
    sessao.pedido.modoEntrega = 'delivery';
    return await this.perguntarEndereco(sessao);
  }

  if (msgLower === '2' || nlp.intent === 'retirada' || msgLower.includes('retirada') || msgLower.includes('buscar') || msgLower.includes('retirar')) {
    sessao.pedido.modoEntrega = 'retirada';
    return await this.mostrarConfirmacao(sessao);
  }

  return '🤔 Por favor, escolha:\n\n1 - Entrega (delivery)\n2 - Retirada';
}

// Perguntar endereço
async function perguntarEndereco(sessao) {
  // Importa ESTADOS e CONFIG do chatbot-flow.js
  const { ESTADOS, CONFIG } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.COLETANDO_ENDERECO);
  const msg = `📍 Qual o endereço para entrega?\n\nDigite o endereço completo:\n_Rua, número, complemento (se houver)_\n\n💡 Taxa de entrega: R$ ${CONFIG.taxaEntrega.toFixed(2)}`;
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Coleta de endereço
async function handleColetaEndereco(sessao, mensagem) {
  sessao.pedido.endereco = mensagem;
  return await this.mostrarConfirmacao(sessao);
}

// Mostrar confirmação do pedido
async function mostrarConfirmacao(sessao) {
  // Importa ESTADOS e CONFIG do chatbot-flow.js
  const { ESTADOS, CONFIG } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.CONFIRMANDO_PEDIDO);

  // Calcular total
  let subtotal = 0;
  sessao.pedido.produtos.forEach(p => {
    subtotal += p.preco * p.quantidade;
  });

  const taxa = sessao.pedido.modoEntrega === 'delivery' ? CONFIG.taxaEntrega : 0;
  const total = subtotal + taxa;
  sessao.pedido.total = total;

  let msg = '✅ *RESUMO DO PEDIDO*\n\n';
  msg += '🛒 *Itens:*\n';
  sessao.pedido.produtos.forEach(p => {
    msg += `  ${p.quantidade}x ${p.nome} - R$ ${(p.preco * p.quantidade).toFixed(2)}\n`;
  });

  if (sessao.pedido.observacao) {
    msg += `\n📝 *Observação:* ${sessao.pedido.observacao}\n`;
  }

  msg += `\n📦 *Modo:* ${sessao.pedido.modoEntrega === 'delivery' ? '🚗 Entrega' : '🏃 Retirada'}\n`;
  
  if (sessao.pedido.modoEntrega === 'delivery') {
    msg += `📍 *Endereço:* ${sessao.pedido.endereco}\n`;
  }

  msg += '\n💰 *Valores:*\n';
  msg += `  Subtotal: R$ ${subtotal.toFixed(2)}\n`;
  if (taxa > 0) {
    msg += `  Taxa de entrega: R$ ${taxa.toFixed(2)}\n`;
  }
  msg += `  *TOTAL: R$ ${total.toFixed(2)}*\n`;

  msg += '\n✅ Confirmar pedido?\n\nDigite *sim* para confirmar ou *não* para cancelar.';

  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Confirmação do pedido
async function handleConfirmacao(sessao, mensagem, nlp) {
  const msgLower = mensagem.toLowerCase().trim();

  if (msgLower === 'sim' || msgLower === 'confirmar' || msgLower === 'ok' || nlp.intent === 'confirmar') {
    return await this.perguntarPagamento(sessao);
  }

  if (msgLower === 'não' || msgLower === 'nao' || msgLower === 'cancelar') {
    this.limparSessao(sessao.telefone);
    return CONFIG.mensagens.pedidoCancelado;
  }

  return '🤔 Por favor, confirme o pedido digitando *sim* ou *não*.';
}

// Perguntar forma de pagamento
async function perguntarPagamento(sessao) {
  // Importa ESTADOS do chatbot-flow.js
  const { ESTADOS } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.ESCOLHENDO_PAGAMENTO);
  const msg = '💳 *FORMA DE PAGAMENTO*\n\nComo deseja pagar?\n\n1️⃣ *PIX* 🔵\n2️⃣ *Dinheiro* 💵\n3️⃣ *Cartão* (na entrega) 💳\n\nDigite o número ou o nome da opção.';
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Escolha de pagamento
async function handleEscolhaPagamento(sessao, mensagem, nlp) {
  const msgLower = mensagem.toLowerCase().trim();

  if (msgLower === '1' || nlp.intent === 'pix' || msgLower.includes('pix')) {
    sessao.pedido.pagamento = 'pix';
    return await this.processarPix(sessao);
  }

  if (msgLower === '2' || nlp.intent === 'dinheiro' || msgLower.includes('dinheiro')) {
    sessao.pedido.pagamento = 'dinheiro';
    return await this.perguntarTroco(sessao);
  }

  if (msgLower === '3' || nlp.intent === 'cartao' || msgLower.includes('cartão') || msgLower.includes('cartao')) {
    sessao.pedido.pagamento = 'cartao';
    return await this.finalizarPedido(sessao);
  }

  return '🤔 Por favor, escolha:\n\n1 - PIX\n2 - Dinheiro\n3 - Cartão';
}

// Processar pagamento PIX
async function processarPix(sessao) {
  const { ESTADOS } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.PROCESSANDO_PIX);
  const msg = `🔵 *PAGAMENTO VIA PIX*\n\n📱 Chave PIX:\n*11987654321*\n(Telefone)\n\n💰 Valor: R$ ${sessao.pedido.total.toFixed(2)}\n\n✅ Após realizar o pagamento, tire um print do comprovante e envie aqui!\n\nOu digite *pago* quando finalizar.`;
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Confirmação PIX
async function handlePix(sessao, mensagem) {
  const msgLower = mensagem.toLowerCase().trim();
  
  if (msgLower === 'pago' || msgLower === 'enviei' || msgLower === 'feito') {
    return await this.finalizarPedido(sessao);
  }

  return '✅ Comprovante recebido!\n\nDigite *pago* quando tiver finalizado o pagamento.';
}

// Perguntar sobre troco
async function perguntarTroco(sessao) {
  const { ESTADOS } = require('./chatbot-flow');
  this.atualizarEstado(sessao, ESTADOS.PROCESSANDO_DINHEIRO);
  const msg = `💵 *PAGAMENTO EM DINHEIRO*\n\n💰 Total: R$ ${sessao.pedido.total.toFixed(2)}\n\nVai precisar de troco?\n\nDigite o valor da nota ou *não* se tiver trocado.`;
  this.salvarHistorico(sessao, 'bot', msg);
  return msg;
}

// Handler: Troco
async function handleDinheiro(sessao, mensagem) {
  const msgLower = mensagem.toLowerCase().trim();
  
  if (msgLower === 'não' || msgLower === 'nao' || msgLower === 'não precisa') {
    sessao.pedido.troco = 0;
    return await this.finalizarPedido(sessao);
  }

  // Tentar extrair valor numérico
  const valorMatch = mensagem.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (valorMatch) {
    const valor = parseFloat(valorMatch[1].replace(',', '.'));
    sessao.pedido.troco = valor - sessao.pedido.total;
    return await this.finalizarPedido(sessao);
  }

  return `💵 Por favor, informe o valor da nota para calcularmos o troco.\n\nExemplo: *50* ou *100*\n\nOu digite *não* se tiver trocado.`;
}

// Gerar texto completo do pedido
function gerarTextoCompleto(sessao) {
  let texto = 'Pedido via WhatsApp:\n\n';
  texto += 'Produtos:\n';
  sessao.pedido.produtos.forEach(p => {
    texto += `- ${p.quantidade}x ${p.nome} (R$ ${p.preco.toFixed(2)})\n`;
  });
  if (sessao.pedido.observacao) {
    texto += `\nObservação: ${sessao.pedido.observacao}\n`;
  }
  texto += `\nModo: ${sessao.pedido.modoEntrega}\n`;
  if (sessao.pedido.endereco) {
    texto += `Endereço: ${sessao.pedido.endereco}\n`;
  }
  texto += `Pagamento: ${sessao.pedido.pagamento}\n`;
  if (sessao.pedido.troco && sessao.pedido.troco > 0) {
    texto += `Troco para: R$ ${(sessao.pedido.total + sessao.pedido.troco).toFixed(2)}\n`;
  }
  texto += `Total: R$ ${sessao.pedido.total.toFixed(2)}`;
  return texto;
}

// Finalizar pedido e salvar no banco
async function finalizarPedido(sessao) {
  try {
    const { ESTADOS } = require('./chatbot-flow');
    
    // Validação final dos itens do pedido
    const itensValidados = (sessao.pedido.produtos || []).map((p, idx) => ({
      id: idx.toString(),
      productId: p.produtoId,
      name: p.nome,
      quantity: Math.max(1, Math.min(99, typeof p.quantidade === 'number' ? p.quantidade : 1)),
      price: typeof p.preco === 'number' && p.preco > 0 ? p.preco : 0
    })).filter(p => p.productId && p.name && p.price > 0);

    // Calcular total validado
    let totalValidado = 0;
    itensValidados.forEach(p => {
      totalValidado += p.price * p.quantity;
    });

    // Criar pedido no banco
    const pedidoData = {
      nome: sessao.nomeCliente || 'Cliente WhatsApp',
      telefone: sessao.telefone,
      texto: gerarTextoCompleto(sessao),
      items: itensValidados,
      status: 'pending',
      total: totalValidado,
      paymentMethod: sessao.pedido.pagamento,
      deliveryMode: sessao.pedido.modoEntrega,
      address: sessao.pedido.endereco,
      notes: sessao.pedido.observacao,
      humanTakeover: sessao.pedido.humanTakeover || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let pedido;
    const mongoose = require('mongoose');
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      pedido = new this.Pedido(pedidoData);
      await pedido.save();
    } else {
      pedido = {
        _id: Date.now().toString(),
        ...pedidoData
      };
      // Salvar em memória se MongoDB não disponível
      console.log('📝 Pedido salvo em memória:', pedido._id);
    }

    // Emitir evento para painel em tempo real
    if (this.io) {
      this.io.emit('novo-pedido', pedido);
    }

    console.log('✅ Pedido finalizado:', pedido._id);

    // Atualizar estado
    this.atualizarEstado(sessao, ESTADOS.FINALIZADO);

    // Mensagem de sucesso
    let msg = `🎉 *PEDIDO CONFIRMADO!*\n\n`;
    msg += `📝 Número do pedido: #${pedido._id.toString().slice(-6)}\n\n`;
    msg += `⏱ Status: *Aguardando preparo*\n\n`;
    msg += `Você receberá atualizações automáticas sobre o status do seu pedido!\n\n`;
    
    if (sessao.pedido.modoEntrega === 'delivery') {
      msg += `🚗 Previsão de entrega: 40-60 minutos\n`;
    } else {
      msg += `🏃 Quando estiver pronto, avisaremos para você buscar!\n`;
    }

    if (sessao.pedido.pagamento === 'dinheiro' && sessao.pedido.troco > 0) {
      msg += `\n💵 Levar troco para: R$ ${(sessao.pedido.total + sessao.pedido.troco).toFixed(2)}\n`;
    }

    msg += `\n✨ Obrigado pela preferência!`;

    this.salvarHistorico(sessao, 'bot', msg);

    // Limpar sessão
    this.limparSessao(sessao.telefone);

    return msg;
  } catch (error) {
    console.error('❌ Erro ao finalizar pedido:', error);
    return '😔 Desculpe, ocorreu um erro ao finalizar seu pedido. Por favor, tente novamente ou digite *atendente*.';
  }
}

// Handler: Estado mostrando_cardapio
async function handleCardapio(sessao, mensagem, nlp) {
  // Se pedir cardápio novamente, mostra o cardápio
  if (nlp.intent === 'ver_cardapio' || mensagem.toLowerCase().trim() === 'cardápio') {
    return await this.mostrarCardapio(sessao);
  }
  // Se enviar produto, redireciona para coleta de produtos
  return await this.handleColetaProdutos(sessao, mensagem, nlp);
}

// Exportar handlers adicionais
module.exports = {
  handleColetaProdutos,
  handleCardapio,
  identificarProdutos,
  analisarEntradaLivre,
  perguntarObservacao,
  handleColetaObservacao,
  perguntarModoEntrega,
  handleEscolhaModo,
  perguntarEndereco,
  handleColetaEndereco,
  mostrarConfirmacao,
  handleConfirmacao,
  perguntarPagamento,
  handleEscolhaPagamento,
  processarPix,
  handlePix,
  perguntarTroco,
  handleDinheiro,
  gerarTextoCompleto,
  finalizarPedido
};

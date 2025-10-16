const { NlpManager } = require('node-nlp');

function createNlpManager() {
  console.log('🧠 Inicializando NLP...');
  const manager = new NlpManager({ languages: ['pt'], forceNER: true });

  manager.addDocument('pt', 'quero pedir uma pizza', 'pedido.pizza');
  manager.addDocument('pt', 'quero uma pizza', 'pedido.pizza');
  manager.addDocument('pt', 'pizza margherita', 'pedido.pizza');
  manager.addDocument('pt', 'gostaria de um hambúrguer', 'pedido.hamburguer');
  manager.addDocument('pt', 'quero um burger', 'pedido.hamburguer');
  manager.addDocument('pt', 'x-burger', 'pedido.hamburguer');
  manager.addDocument('pt', 'quero uma coca', 'pedido.bebida');
  manager.addDocument('pt', 'refrigerante', 'pedido.bebida');
  manager.addDocument('pt', 'fazer pedido', 'pedido.generic');
  manager.addDocument('pt', 'quero pedir', 'pedido.generic');
  manager.addDocument('pt', 'cardápio', 'cardapio');
  manager.addDocument('pt', 'menu', 'cardapio');
  manager.addDocument('pt', 'o que tem?', 'cardapio');
  manager.addDocument('pt', 'quanto custa', 'preco');
  manager.addDocument('pt', 'qual o valor', 'preco');
  manager.addDocument('pt', 'falar com atendente', 'humano');
  manager.addDocument('pt', 'quero falar com alguém', 'humano');

  manager.addAnswer('pt', 'pedido.pizza', 'Ótima escolha! Pizza anotada.');
  manager.addAnswer('pt', 'pedido.hamburguer', 'Hambúrguer anotado!');
  manager.addAnswer('pt', 'pedido.bebida', 'Bebida anotada!');
  manager.addAnswer('pt', 'pedido.generic', 'Pedido recebido!');
  manager.addAnswer('pt', 'cardapio', 'Vou te mostrar nosso cardápio!');
  manager.addAnswer('pt', 'preco', 'Vou verificar os preços para você!');
  manager.addAnswer('pt', 'humano', 'Transferindo para atendente humano...');

  return manager;
}

async function trainAndSave(manager) {
  await manager.train();
  manager.save();
  console.log('✅ NLP treinado e salvo');
}

module.exports = {
  createNlpManager,
  trainAndSave
};

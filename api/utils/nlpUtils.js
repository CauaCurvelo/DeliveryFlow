function extractProductsFromNLP(nlpResult) {
  const produtos = [];

  if (nlpResult.intent === 'pedido.pizza') {
    produtos.push({ nome: 'Pizza', quantidade: 1 });
  } else if (nlpResult.intent === 'pedido.hamburguer') {
    produtos.push({ nome: 'Hambúrguer', quantidade: 1 });
  } else if (nlpResult.intent === 'pedido.bebida') {
    produtos.push({ nome: 'Bebida', quantidade: 1 });
  }

  return produtos;
}

module.exports = {
  extractProductsFromNLP
};

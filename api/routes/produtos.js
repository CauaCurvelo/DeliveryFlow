const express = require('express');

function createProdutosRouter({ produtoService, io }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const produtos = await produtoService.listProdutos();
      console.log(`📦 Listando ${produtos.length} produtos`);
      res.json(produtos);
    } catch (error) {
      console.error('❌ Erro ao listar produtos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const produtoData = {
        ...req.body,
        criadoEm: new Date()
      };

      const produto = await produtoService.createProduto(produtoData);
      console.log('✅ Produto criado:', produto._id);
      io.emit('produto-criado', produto);
      res.status(201).json(produto);
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const produto = await produtoService.updateProduto(id, req.body);

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      console.log('✅ Produto atualizado:', id);
      io.emit('produto-atualizado', produto);
      res.json(produto);
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await produtoService.removeProduto(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      console.log('✅ Produto deletado:', id);
      io.emit('produto-deletado', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createProdutosRouter
};

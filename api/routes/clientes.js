const express = require('express');

function createClientesRouter({ clienteService }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const clientes = await clienteService.listClientes();
      console.log(`👥 Listando ${clientes.length} clientes`);
      res.json(clientes);
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:telefone', async (req, res) => {
    try {
      const { telefone } = req.params;
      const cliente = await clienteService.findClienteByTelefone(telefone);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      res.json(cliente);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await clienteService.removeCliente(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      console.log('✅ Cliente deletado:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = {
  createClientesRouter
};

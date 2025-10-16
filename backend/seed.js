// Script para popular o banco de dados com dados de exemplo
const mongoose = require('mongoose');

console.log('🌱 Populando banco de dados...');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/deliveryflow', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ Conectado ao MongoDB'))
.catch(err => {
  console.error('❌ Erro ao conectar:', err.message);
  process.exit(1);
});

// Schemas
const pedidoSchema = new mongoose.Schema({
  nome: String,
  telefone: String,
  texto: String,
  itens: [String],
  status: { type: String, default: 'pending' },
  total: { type: Number, default: 0 },
  metodoPagamento: String,
  modoEntrega: String,
  endereco: String,
  observacoes: String,
  humanTakeover: { type: Boolean, default: false },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

const produtoSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  preco: Number,
  categoria: String,
  imagem: String,
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);
const Produto = mongoose.model('Produto', produtoSchema);

// Dados de exemplo
const produtos = [
  {
    nome: 'Pizza Margherita G',
    descricao: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    preco: 45.00,
    categoria: 'Pizzas',
    imagem: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    ativo: true
  },
  {
    nome: 'X-Burger Bacon',
    descricao: 'Hambúrguer artesanal, queijo, bacon crocante, alface e tomate',
    preco: 28.00,
    categoria: 'Burgers',
    imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    ativo: true
  },
  {
    nome: 'Salada Caesar',
    descricao: 'Alface romana, croutons, parmesão e molho caesar',
    preco: 32.00,
    categoria: 'Saladas',
    imagem: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ativo: true
  },
  {
    nome: 'Batata Frita G',
    descricao: 'Batatas fritas crocantes com molho especial',
    preco: 18.00,
    categoria: 'Acompanhamentos',
    imagem: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    ativo: true
  },
  {
    nome: 'Refrigerante 2L',
    descricao: 'Coca-Cola, Guaraná ou Fanta',
    preco: 10.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    ativo: true
  },
  {
    nome: 'Suco Natural 500ml',
    descricao: 'Laranja, limão ou morango',
    preco: 12.00,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    ativo: true
  },
  {
    nome: 'Brownie com Sorvete',
    descricao: 'Brownie de chocolate quente com sorvete de baunilha',
    preco: 22.00,
    categoria: 'Sobremesas',
    imagem: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    ativo: true
  }
];

const pedidos = [
  {
    nome: 'Maria Silva',
    telefone: '5511987654321',
    texto: 'Quero uma pizza margherita grande e um refrigerante 2L',
    itens: ['Pizza Margherita G', 'Refrigerante 2L'],
    status: 'pending',
    total: 55.00,
    metodoPagamento: 'pix',
    modoEntrega: 'delivery',
    endereco: 'Rua das Flores, 123 - Apto 45',
    observacoes: 'Sem cebola',
    humanTakeover: false,
    criadoEm: new Date(Date.now() - 5 * 60000), // 5 minutos atrás
    atualizadoEm: new Date(Date.now() - 5 * 60000)
  },
  {
    nome: 'João Santos',
    telefone: '5511976543210',
    texto: 'X-burger bacon com batata frita',
    itens: ['X-Burger Bacon', 'Batata Frita G'],
    status: 'preparing',
    total: 46.00,
    metodoPagamento: 'dinheiro',
    modoEntrega: 'delivery',
    endereco: 'Av. Principal, 456',
    observacoes: 'Ponto da carne: mal passado',
    humanTakeover: false,
    criadoEm: new Date(Date.now() - 15 * 60000), // 15 minutos atrás
    atualizadoEm: new Date(Date.now() - 10 * 60000)
  },
  {
    nome: 'Ana Paula',
    telefone: '5511965432109',
    texto: 'Salada caesar e suco natural',
    itens: ['Salada Caesar', 'Suco Natural 500ml'],
    status: 'ready',
    total: 44.00,
    metodoPagamento: 'cartão',
    modoEntrega: 'retirada',
    endereco: '',
    observacoes: 'Suco de laranja',
    humanTakeover: false,
    criadoEm: new Date(Date.now() - 25 * 60000), // 25 minutos atrás
    atualizadoEm: new Date(Date.now() - 5 * 60000)
  },
  {
    nome: 'Carlos Mendes',
    telefone: '5511954321098',
    texto: 'Pizza margherita, batata frita e brownie',
    itens: ['Pizza Margherita G', 'Batata Frita G', 'Brownie com Sorvete'],
    status: 'delivering',
    total: 85.00,
    metodoPagamento: 'pix',
    modoEntrega: 'delivery',
    endereco: 'Rua dos Pinheiros, 789',
    observacoes: '',
    humanTakeover: false,
    criadoEm: new Date(Date.now() - 40 * 60000), // 40 minutos atrás
    atualizadoEm: new Date(Date.now() - 2 * 60000)
  },
  {
    nome: 'Fernanda Costa',
    telefone: '5511943210987',
    texto: 'Quero dois hamburgueres e dois refrigerantes',
    itens: ['X-Burger Bacon', 'X-Burger Bacon', 'Refrigerante 2L', 'Refrigerante 2L'],
    status: 'pending',
    total: 76.00,
    metodoPagamento: 'pix',
    modoEntrega: 'delivery',
    endereco: 'Rua das Acácias, 321',
    observacoes: 'Interfone 32',
    humanTakeover: false,
    criadoEm: new Date(Date.now() - 2 * 60000), // 2 minutos atrás
    atualizadoEm: new Date(Date.now() - 2 * 60000)
  },
  {
    nome: 'Roberto Lima',
    telefone: '5511932109876',
    texto: 'falar com atendente',
    itens: [],
    status: 'pending',
    total: 0,
    metodoPagamento: '',
    modoEntrega: '',
    endereco: '',
    observacoes: 'Cliente solicitou atendimento humano',
    humanTakeover: true,
    criadoEm: new Date(Date.now() - 1 * 60000), // 1 minuto atrás
    atualizadoEm: new Date(Date.now() - 1 * 60000)
  }
];

async function seed() {
  try {
    // Limpar dados existentes
    await Produto.deleteMany({});
    await Pedido.deleteMany({});
    console.log('🗑️  Dados antigos removidos');

    // Inserir produtos
    const produtosInseridos = await Produto.insertMany(produtos);
    console.log(`✅ ${produtosInseridos.length} produtos inseridos`);

    // Inserir pedidos
    const pedidosInseridos = await Pedido.insertMany(pedidos);
    console.log(`✅ ${pedidosInseridos.length} pedidos inseridos`);

    console.log('🎉 Banco de dados populado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    process.exit(1);
  }
}

// Aguardar conexão e executar
setTimeout(seed, 1000);

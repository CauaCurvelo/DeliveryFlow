const pedidosMemoria = [];
const clientesMemoria = [];

const produtosMemoria = [
  {
    _id: 'P1',
    nome: 'Pizza Margherita G',
    descricao: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    preco: 45.0,
    categoria: 'Pizzas',
    imagem: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P2',
    nome: 'X-Burger Bacon',
    descricao: 'Hambúrguer artesanal, queijo, bacon crocante, alface e tomate',
    preco: 28.0,
    categoria: 'Burgers',
    imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P3',
    nome: 'Salada Caesar',
    descricao: 'Alface romana, croutons, parmesão e molho caesar',
    preco: 32.0,
    categoria: 'Saladas',
    imagem: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P4',
    nome: 'Pasta Carbonara',
    descricao: 'Massa fresca com molho carbonara, bacon e parmesão',
    preco: 38.0,
    categoria: 'Massas',
    imagem: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P5',
    nome: 'Refrigerante 2L',
    descricao: 'Coca-Cola, Guaraná ou Sprite',
    preco: 10.0,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P6',
    nome: 'Batata Frita G',
    descricao: 'Batatas fritas crocantes com sal especial',
    preco: 18.0,
    categoria: 'Acompanhamentos',
    imagem: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P7',
    nome: 'Tiramisu',
    descricao: 'Sobremesa italiana tradicional com café e mascarpone',
    preco: 15.0,
    categoria: 'Sobremesas',
    imagem: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P8',
    nome: 'Pizza Calabresa G',
    descricao: 'Molho de tomate, mussarela, calabresa e cebola',
    preco: 48.0,
    categoria: 'Pizzas',
    imagem: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P9',
    nome: 'Suco Natural 500ml',
    descricao: 'Laranja, Limão, Maracujá ou Morango',
    preco: 8.0,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P10',
    nome: 'Suco de Laranja',
    descricao: 'Suco de laranja natural 500ml',
    preco: 8.0,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P11',
    nome: 'Suco de Limão',
    descricao: 'Suco de limão natural 500ml',
    preco: 7.0,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe1e07?w=400',
    ativo: true,
    criadoEm: new Date()
  },
  {
    _id: 'P12',
    nome: 'Água Mineral',
    descricao: 'Água mineral sem gás 500ml',
    preco: 3.0,
    categoria: 'Bebidas',
    imagem: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    ativo: true,
    criadoEm: new Date()
  }
];

const botConfigMemoria = {
  horarioFuncionamento: {
    horaAbertura: '18:00',
    horaFechamento: '23:00',
    diasFuncionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
  }
};

const tableConfigMemoria = {
  totalTables: 20
};

const generalConfigMemoria = {
  taxaEntrega: 5.0,
  pedidoMinimo: 15.0,
  telefone: '',
  whatsapp: '',
  instagram: '',
  notificacoesSonoras: true
};

module.exports = {
  pedidosMemoria,
  clientesMemoria,
  produtosMemoria,
  botConfigMemoria,
  tableConfigMemoria,
  generalConfigMemoria
};

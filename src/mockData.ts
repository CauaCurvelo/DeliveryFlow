export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentMethod: 'pix' | 'card' | 'cash' | 'pending';
  deliveryMode: 'delivery' | 'pickup' | 'local';
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  humanTakeover?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  active: boolean;
  createdAt: Date;
}

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Maria Silva',
    customerPhone: '(11) 98765-4321',
    items: [
      { id: '1', productId: 'P1', name: 'Pizza Margherita G', quantity: 1, price: 45.00 },
      { id: '2', productId: 'P5', name: 'Refrigerante 2L', quantity: 1, price: 10.00 }
    ],
    total: 55.00,
    status: 'pending',
    paymentMethod: 'pix',
    deliveryMode: 'delivery',
    address: 'Rua das Flores, 123 - Apto 45',
    notes: 'Sem cebola',
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: 'ORD-002',
    customerName: 'João Santos',
    customerPhone: '(11) 91234-5678',
    items: [
      { id: '3', productId: 'P2', name: 'X-Burger Bacon', quantity: 2, price: 28.00 },
      { id: '4', productId: 'P6', name: 'Batata Frita G', quantity: 1, price: 18.00 }
    ],
    total: 74.00,
    status: 'preparing',
    paymentMethod: 'card',
    deliveryMode: 'delivery',
    address: 'Av. Paulista, 1000',
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(Date.now() - 2 * 60000),
  },
  {
    id: 'ORD-003',
    customerName: 'Ana Costa',
    customerPhone: '(11) 99999-8888',
    items: [
      { id: '5', productId: 'P3', name: 'Salada Caesar', quantity: 1, price: 32.00 }
    ],
    total: 32.00,
    status: 'ready',
    paymentMethod: 'cash',
    deliveryMode: 'pickup',
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(Date.now() - 1 * 60000),
  },
  {
    id: 'ORD-004',
    customerName: 'Pedro Oliveira',
    customerPhone: '(11) 97777-6666',
    items: [
      { id: '6', productId: 'P4', name: 'Pasta Carbonara', quantity: 1, price: 38.00 },
      { id: '7', productId: 'P7', name: 'Tiramisu', quantity: 1, price: 15.00 }
    ],
    total: 53.00,
    status: 'delivering',
    paymentMethod: 'pix',
    deliveryMode: 'delivery',
    address: 'Rua Augusta, 500 - Casa 2',
    createdAt: new Date(Date.now() - 35 * 60000),
    updatedAt: new Date(Date.now() - 10 * 60000),
  },
  {
    id: 'ORD-005',
    customerName: 'Carla Mendes',
    customerPhone: '(11) 96666-5555',
    items: [
      { id: '8', productId: 'P1', name: 'Pizza Calabresa G', quantity: 1, price: 48.00 }
    ],
    total: 48.00,
    status: 'delivered',
    paymentMethod: 'card',
    deliveryMode: 'delivery',
    address: 'Rua Consolação, 800',
    createdAt: new Date(Date.now() - 60 * 60000),
    updatedAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: 'ORD-006',
    customerName: 'Lucas Ferreira',
    customerPhone: '(11) 95555-4444',
    items: [
      { id: '9', productId: 'P2', name: 'X-Burger Duplo', quantity: 1, price: 35.00 }
    ],
    total: 35.00,
    status: 'pending',
    paymentMethod: 'pix',
    deliveryMode: 'pickup',
    humanTakeover: true,
    notes: 'Cliente quer falar com atendente',
    createdAt: new Date(Date.now() - 3 * 60000),
    updatedAt: new Date(Date.now() - 3 * 60000),
  },
];

export const mockProducts: Product[] = [
  {
    id: 'P1',
    name: 'Pizza Margherita G',
    description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
    price: 45.00,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    active: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000),
  },
  {
    id: 'P2',
    name: 'X-Burger Bacon',
    description: 'Hambúrguer artesanal, queijo, bacon crocante, alface e tomate',
    price: 28.00,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    active: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000),
  },
  {
    id: 'P3',
    name: 'Salada Caesar',
    description: 'Alface romana, croutons, parmesão e molho caesar',
    price: 32.00,
    category: 'Saladas',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    active: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60000),
  },
  {
    id: 'P4',
    name: 'Pasta Carbonara',
    description: 'Massa fresca com molho carbonara, bacon e parmesão',
    price: 38.00,
    category: 'Massas',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    active: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60000),
  },
  {
    id: 'P5',
    name: 'Refrigerante 2L',
    description: 'Coca-Cola, Guaraná ou Sprite',
    price: 10.00,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    active: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000),
  },
  {
    id: 'P6',
    name: 'Batata Frita G',
    description: 'Batatas fritas crocantes com sal especial',
    price: 18.00,
    category: 'Acompanhamentos',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    active: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60000),
  },
  {
    id: 'P7',
    name: 'Tiramisu',
    description: 'Sobremesa italiana tradicional com café e mascarpone',
    price: 15.00,
    category: 'Sobremesas',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    active: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000),
  },
  {
    id: 'P8',
    name: 'Pizza Calabresa G',
    description: 'Molho de tomate, mussarela, calabresa e cebola',
    price: 48.00,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    active: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60000),
  },
];

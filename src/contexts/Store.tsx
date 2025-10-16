import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Product, mockOrders, mockProducts } from '../mockData';
import { toast } from 'sonner';

export interface Customer {
  _id: string;
  nome: string;
  telefone: string;
  ultimoPedido: Date;
  totalPedidos?: number;
}

interface StoreContextType {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  toggleProductActive: (productId: string) => void;
  deleteCustomer: (customerId: string) => void;
  filterStatus: Order['status'] | 'all';
  setFilterStatus: (status: Order['status'] | 'all') => void;
  filterMode: Order['deliveryMode'] | 'all';
  setFilterMode: (mode: Order['deliveryMode'] | 'all') => void;
  filterPayment: Order['paymentMethod'] | 'all';
  setFilterPayment: (payment: Order['paymentMethod'] | 'all') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Em ambiente de teste, inicializa com mockOrders e ignora fetch/WebSocket
  const isTest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined;
  // Detecta ambiente Cypress
  const isCypress = typeof window !== 'undefined' && (window as any).Cypress;
  
  console.log('🏪 StoreProvider: Inicializando', { isTest, isCypress });
  
  function reviveDates(arr: any[]) {
    return arr.map(obj => {
      const newObj = { ...obj };
      if (typeof newObj.createdAt === 'string') newObj.createdAt = new Date(newObj.createdAt);
      if (typeof newObj.updatedAt === 'string') newObj.updatedAt = new Date(newObj.updatedAt);
      if (Array.isArray(newObj.items)) {
        newObj.items = newObj.items.map((item: any) => {
          const itemCopy = { ...item };
          if (typeof itemCopy.createdAt === 'string') itemCopy.createdAt = new Date(itemCopy.createdAt);
          if (typeof itemCopy.updatedAt === 'string') itemCopy.updatedAt = new Date(itemCopy.updatedAt);
          return itemCopy;
        });
      }
      return newObj;
    });
  }
  let initialOrders = [];
  let initialProducts = [];
  if (isTest) {
    initialOrders = reviveDates(mockOrders);
    initialProducts = reviveDates(mockProducts);
  } else if (isCypress) {
    initialOrders = reviveDates((window as any).mockOrders || []);
    initialProducts = reviveDates((window as any).mockProducts || []);
  } else {
    // Em desenvolvimento sem backend, usa dados mockados
    initialOrders = reviveDates(mockOrders);
    initialProducts = reviveDates(mockProducts);
  }
  
  console.log('🏪 StoreProvider: Dados iniciais', {
    orders: initialOrders.length,
    products: initialProducts.length
  });
  
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'all'>('all');
  const [filterMode, setFilterMode] = useState<Order['deliveryMode'] | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<Order['paymentMethod'] | 'all'>('all');

  useEffect(() => {
    if (isTest || isCypress) return; // Não faz fetch nem WebSocket em teste/Cypress
    
    // Tentar conectar ao backend, mas não quebrar se falhar
    fetch('http://localhost:4000/api/pedidos')
      .then(res => {
        if (!res.ok) throw new Error('Backend não disponível');
        return res.json();
      })
      .then(data => {
        console.log('✅ Backend conectado, carregando pedidos...');
        // Adaptar dados do backend para o formato do front
        const pedidos = data.map((pedido: any) => ({
          id: pedido._id || '',
          customerName: pedido.nome || 'Cliente WhatsApp',
          customerPhone: pedido.telefone || '',
          items: Array.isArray(pedido.itens)
            ? pedido.itens.map((item: any, idx: number) => {
                if (item && typeof item === 'object' && item.nome) {
                  return {
                    id: String(idx),
                    productId: item.produtoId || '',
                    name: item.nome || '',
                    quantity: typeof item.quantidade === 'number' ? item.quantidade : 1,
                    price: typeof item.preco === 'number' ? item.preco : 0,
                  };
                }
                // Fallback para string simples (formato antigo)
                return {
                  id: String(idx),
                  productId: '',
                  name: typeof item === 'string' ? item : '',
                  quantity: 1,
                  price: 0,
                };
              })
            : [],
          total: typeof pedido.total === 'number' ? pedido.total : 0,
          status: pedido.status || 'pending',
          paymentMethod: pedido.metodoPagamento || 'pix',
          deliveryMode: pedido.modoEntrega || 'delivery',
          address: pedido.endereco || '',
          notes: pedido.observacoes || '',
          createdAt: pedido.criadoEm ? new Date(pedido.criadoEm) : new Date(),
          updatedAt: pedido.criadoEm ? new Date(pedido.criadoEm) : new Date(),
        }));
        setOrders(pedidos);
      })
      .catch(err => {
        console.log('⚠️ Backend não disponível, usando dados mockados:', err.message);
        // Já inicializamos com mockOrders, então não precisa fazer nada
      });
    
    // Carregar produtos do backend
    fetch('http://localhost:4000/api/produtos')
      .then(res => {
        if (!res.ok) throw new Error('Backend não disponível');
        return res.json();
      })
      .then(data => {
        console.log('✅ Carregando produtos do backend...');
        const produtos = data.map((produto: any) => ({
          id: produto._id || '',
          name: produto.nome || '',
          description: produto.descricao || '',
          price: produto.preco || 0,
          category: produto.categoria || 'Outros',
          image: produto.imagem || '',
          active: produto.ativo !== undefined ? produto.ativo : true,
          createdAt: produto.criadoEm ? new Date(produto.criadoEm) : new Date(),
        }));
        setProducts(produtos);
      })
      .catch(err => {
        console.log('⚠️ Backend não disponível para produtos, usando dados mockados:', err.message);
      });
    
    // Carregar clientes do backend
    fetch('http://localhost:4000/api/clientes')
      .then(res => {
        if (!res.ok) throw new Error('Backend não disponível');
        return res.json();
      })
      .then(data => {
        console.log('✅ Carregando clientes do backend...');
        const clientes = data.map((cliente: any) => ({
          _id: cliente._id || '',
          nome: cliente.nome || '',
          telefone: cliente.telefone || '',
          ultimoPedido: cliente.ultimoPedido ? new Date(cliente.ultimoPedido) : new Date(),
          totalPedidos: cliente.totalPedidos || 0,
        }));
        setCustomers(clientes);
      })
      .catch(err => {
        console.log('⚠️ Backend não disponível para clientes:', err.message);
      });
    
    // WebSocket para novos pedidos (só se window.io existir)
    if (typeof (window as any).io === 'function') {
      try {
        const socket = new (window as any).io('http://localhost:4000');
        
        socket.on('connect', () => {
          console.log('✅ WebSocket conectado ao backend');
        });
        
        socket.on('connect_error', () => {
          console.log('⚠️ Erro ao conectar WebSocket, continuando sem tempo real');
        });
        
        socket.on('novo-pedido', (pedido: any) => {
          const newOrder: Order = {
            id: pedido._id || '',
            customerName: pedido.nome || 'Cliente WhatsApp',
            customerPhone: pedido.telefone || '',
            items: (pedido.itens || []).map((item: any, idx: number) => {
              // Verifica se item é objeto com estrutura completa
              if (typeof item === 'object' && item.nome) {
                return {
                  id: String(idx),
                  productId: item.produtoId || '',
                  name: item.nome,
                  quantity: item.quantidade || 1,
                  price: item.preco || 0,
                };
              }
              // Fallback para string simples (formato antigo)
              return {
                id: String(idx),
                productId: '',
                name: item,
                quantity: 1,
                price: 0,
              };
            }),
            total: pedido.total || 0,
            status: pedido.status || 'pending',
            paymentMethod: pedido.metodoPagamento || 'pix',
            deliveryMode: pedido.modoEntrega || 'delivery',
            address: pedido.endereco || '',
            notes: pedido.observacoes || '',
            createdAt: pedido.criadoEm ? new Date(pedido.criadoEm) : new Date(),
            updatedAt: pedido.criadoEm ? new Date(pedido.criadoEm) : new Date(),
          };
          
          // Evitar duplicatas - só adicionar se não existir
          setOrders(prev => {
            const exists = prev.some(order => order.id === newOrder.id);
            if (exists) {
              console.log('⚠️ Pedido duplicado ignorado:', newOrder.id);
              return prev;
            }
            
            // Tocar som de notificação
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eeeTRAMUKfk8LZjHAY4kdf');
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Erro ao tocar som:', e));
            } catch (e) {
              console.log('Erro ao criar áudio:', e);
            }
            
            return [newOrder, ...prev];
          });
          
          toast.success('🔔 Novo pedido recebido!', {
            description: `${newOrder.customerName} - R$ ${newOrder.total.toFixed(2)}`,
            duration: 5000,
          });
        });
        
        socket.on('pedido-atualizado', (pedido: any) => {
          setOrders(prev => prev.map(order => 
            order.id === pedido._id 
              ? {
                  ...order,
                  status: pedido.status,
                  updatedAt: new Date(pedido.atualizadoEm || Date.now())
                }
              : order
          ));
        });
        
        socket.on('produto-criado', (produto: any) => {
          const newProduct: Product = {
            id: produto._id || '',
            name: produto.nome || '',
            description: produto.descricao || '',
            price: produto.preco || 0,
            category: produto.categoria || 'Outros',
            image: produto.imagem || '',
            active: produto.ativo !== undefined ? produto.ativo : true,
            createdAt: produto.criadoEm ? new Date(produto.criadoEm) : new Date(),
          };
          setProducts(prev => [newProduct, ...prev]);
          toast.info('Novo produto adicionado', {
            description: newProduct.name,
          });
        });
        
        socket.on('produto-atualizado', (produto: any) => {
          setProducts(prev => prev.map(p => 
            p.id === produto._id
              ? {
                  ...p,
                  name: produto.nome || p.name,
                  description: produto.descricao || p.description,
                  price: produto.preco !== undefined ? produto.preco : p.price,
                  category: produto.categoria || p.category,
                  image: produto.imagem || p.image,
                  active: produto.ativo !== undefined ? produto.ativo : p.active,
                }
              : p
          ));
        });
        
        socket.on('produto-deletado', (produtoId: string) => {
          setProducts(prev => prev.filter(p => p.id !== produtoId));
        });
        
        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.log('⚠️ Socket.io não disponível, continuando sem tempo real');
      }
    } else {
      console.log('⚠️ Socket.io não carregado, continuando sem tempo real');
    }
  }, []);

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    if (status === 'cancelled') {
      // Remove localmente
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Pedido cancelado e removido');
      // Remove do backend
      if (!isTest && !isCypress) {
        fetch(`http://localhost:4000/api/pedidos/${orderId}`, {
          method: 'DELETE',
        })
          .then(res => res.json())
          .then(() => console.log('✅ Pedido removido do backend'))
          .catch(() => console.log('⚠️ Backend não disponível, remoção apenas local'));
      }
      return;
    }
    // Atualizar localmente imediatamente (otimistic update)
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
    const statusLabels = {
      pending: 'Pendente',
      preparing: 'Em Preparo',
      ready: 'Pronto',
      delivering: 'Saiu para Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    toast.success('Status atualizado', {
      description: `Pedido ${orderId}: ${statusLabels[status]}`,
    });
    // Tentar sincronizar com backend (mas não bloqueia se falhar)
    if (!isTest && !isCypress) {
      fetch(`http://localhost:4000/api/pedidos/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
        .then(res => res.json())
        .then(() => console.log('✅ Status sincronizado com backend'))
        .catch(() => console.log('⚠️ Backend não disponível, mudança apenas local'));
    }
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, ...updates, updatedAt: new Date() }
          : order
      )
    );
    toast.success('Pedido atualizado');
    
    // Sincronizar com backend
    if (!isTest && !isCypress) {
      fetch(`http://localhost:4000/api/pedidos/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
        .catch(() => console.log('⚠️ Backend não disponível'));
    }
  };

  const deleteOrder = (orderId: string) => {
    // Remove localmente
    setOrders(prev => prev.filter(order => order.id !== orderId));
    toast.success('Pedido excluído');
    // Remove do backend
    if (!isTest && !isCypress) {
      fetch(`http://localhost:4000/api/pedidos/${orderId}`, {
        method: 'DELETE',
      })
        .then(res => res.json())
        .then(() => console.log('✅ Pedido removido do backend'))
        .catch(() => console.log('⚠️ Backend não disponível, remoção apenas local'));
    }
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    console.log('Produto adicionado (formData):', product);
    const newProduct: Product = {
      ...product,
      id: `P${Date.now()}`,
      createdAt: new Date(),
    };
    console.log('Adicionando produto (objeto completo):', newProduct);
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      console.log('Lista de produtos atualizada após adição:', updated);
      return updated;
    });
    toast.success('Produto adicionado', {
      description: newProduct.name,
    });
    
    // Sincronizar com backend
    if (!isTest && !isCypress) {
      fetch('http://localhost:4000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newProduct.name,
          descricao: newProduct.description,
          preco: newProduct.price,
          categoria: newProduct.category,
          imagem: newProduct.image,
          ativo: newProduct.active
        })
      })
        .then(res => res.json())
        .then(data => {
          // Atualizar o ID local com o ID do backend
          setProducts(prev => prev.map(p => 
            p.id === newProduct.id ? { ...p, id: data._id } : p
          ));
          console.log('✅ Produto sincronizado com backend, ID:', data._id);
        })
        .catch(() => console.log('⚠️ Backend não disponível, produto apenas local'));
    }
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, ...updates }
          : product
      )
    );
    toast.success('Produto atualizado');
    
    // Sincronizar com backend
    if (!isTest && !isCypress) {
      const backendUpdates: any = {};
      if (updates.name) backendUpdates.nome = updates.name;
      if (updates.description) backendUpdates.descricao = updates.description;
      if (updates.price !== undefined) backendUpdates.preco = updates.price;
      if (updates.category) backendUpdates.categoria = updates.category;
      if (updates.image) backendUpdates.imagem = updates.image;
      if (updates.active !== undefined) backendUpdates.ativo = updates.active;
      
      fetch(`http://localhost:4000/api/produtos/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendUpdates)
      })
        .catch(() => console.log('⚠️ Backend não disponível'));
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Produto removido');
    
    // Sincronizar com backend
    if (!isTest && !isCypress) {
      fetch(`http://localhost:4000/api/produtos/${productId}`, {
        method: 'DELETE'
      })
        .catch(() => console.log('⚠️ Backend não disponível'));
    }
  };

  const toggleProductActive = (productId: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, active: !product.active }
          : product
      )
    );
    
    // Sincronizar com backend
    if (!isTest && !isCypress) {
      const product = products.find(p => p.id === productId);
      if (product) {
        fetch(`http://localhost:4000/api/produtos/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !product.active })
        })
          .catch(() => console.log('⚠️ Backend não disponível'));
      }
    }
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c._id !== customerId));
    
    if (!isTest && !isCypress) {
      fetch(`http://localhost:4000/api/clientes/${customerId}`, {
        method: 'DELETE'
      })
        .then(() => toast.success('Cliente excluído'))
        .catch(() => toast.error('Erro ao excluir cliente'));
    }
  };

  return (
    <StoreContext.Provider
      value={{
        orders,
        products,
        customers,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        deleteCustomer,
        filterStatus,
        setFilterStatus,
        filterMode,
        setFilterMode,
        filterPayment,
        setFilterPayment,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

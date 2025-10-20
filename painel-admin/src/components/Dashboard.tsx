import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ShoppingBag, Package, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface DashboardProps {
  socket: Socket | null;
}

interface Stats {
  pedidosHoje: number;
  pedidosPendentes: number;
  totalVendas: number;
  totalClientes: number;
  produtosAtivos: number;
}

interface RecentOrder {
  _id: string;
  nome: string;
  total: number;
  status: string;
  criadoEm: string;
}

export default function Dashboard({ socket }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    pedidosHoje: 0,
    pedidosPendentes: 0,
    totalVendas: 0,
    totalClientes: 0,
    produtosAtivos: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      const [pedidosRes, clientesRes, produtosRes] = await Promise.all([
        fetch(`${API_URL}/api/pedidos`),
        fetch(`${API_URL}/api/clientes`),
        fetch(`${API_URL}/api/produtos`),
      ]);

      const pedidos = await pedidosRes.json();
      const clientes = await clientesRes.json();
      const produtos = await produtosRes.json();

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const pedidosHoje = pedidos.filter((p: any) => {
        const pedidoDate = new Date(p.criadoEm);
        pedidoDate.setHours(0, 0, 0, 0);
        return pedidoDate.getTime() === hoje.getTime();
      });

      const totalVendas = pedidos.reduce((sum: number, p: any) => sum + (p.total || 0), 0);
      const pedidosPendentes = pedidos.filter((p: any) => p.status === 'pending').length;
      const produtosAtivos = produtos.filter((p: any) => p.ativo).length;

      setStats({
        pedidosHoje: pedidosHoje.length,
        pedidosPendentes,
        totalVendas,
        totalClientes: clientes.length,
        produtosAtivos,
      });

      const sorted = pedidos.sort((a: any, b: any) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );
      setRecentOrders(sorted.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('novo-pedido', fetchStats);
      socket.on('pedido-atualizado', fetchStats);
      socket.on('pedido-cancelado', fetchStats);
      
      return () => {
        socket.off('novo-pedido', fetchStats);
        socket.off('pedido-atualizado', fetchStats);
        socket.off('pedido-cancelado', fetchStats);
      };
    }
  }, [socket]);

  const statCards = [
    {
      title: 'Pedidos Hoje',
      value: stats.pedidosHoje,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pendentes',
      value: stats.pedidosPendentes,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Vendas',
      value: `R$ ${stats.totalVendas.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Clientes',
      value: stats.totalClientes,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Produtos Ativos',
      value: stats.produtosAtivos,
      icon: Package,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-none shadow-sm dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card className="border-none shadow-sm dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl dark:text-white">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum pedido ainda</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{order.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.criadoEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      R$ {order.total?.toFixed(2) || '0.00'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

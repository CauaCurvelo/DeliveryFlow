import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, TrendingUp, Calendar } from 'lucide-react';
import { Order } from '../mockData';

interface ReportsProps {
  orders: Order[];
}

export function Reports({ orders }: ReportsProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const filterOrdersByPeriod = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return orders.filter(o => new Date(o.createdAt) >= today);
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orders.filter(o => new Date(o.createdAt) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orders.filter(o => new Date(o.createdAt) >= monthAgo);
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrdersByPeriod(period);
  const completedOrders = filteredOrders.filter(o => o.status === 'delivered');
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
  const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const handleExportReport = () => {
    const headers = ['Data', 'Cliente', 'Telefone', 'Total', 'Status', 'Pagamento', 'Modo Entrega'];
    const rows = filteredOrders.map(o => [
      new Date(o.createdAt).toLocaleString('pt-BR'),
      o.customerName,
      o.customerPhone,
      `R$ ${o.total.toFixed(2)}`,
      o.status,
      o.paymentMethod,
      o.deliveryMode
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-pedidos-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => setPeriod('today')}
            size="sm"
          >
            Hoje
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            size="sm"
          >
            7 Dias
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            size="sm"
          >
            30 Dias
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
            size="sm"
          >
            Tudo
          </Button>
        </div>
        <Button onClick={handleExportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total de Pedidos</p>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{filteredOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {completedOrders.length} entregues, {cancelledOrders.length} cancelados
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos entregues
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-500">{formatCurrency(averageTicket)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Por pedido entregue
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-500">
            {filteredOrders.length > 0 
              ? ((completedOrders.length / filteredOrders.length) * 100).toFixed(1) 
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos concluídos
          </p>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Formas de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['pix', 'card', 'cash'].map(method => {
            const methodOrders = completedOrders.filter(o => o.paymentMethod === method);
            const methodRevenue = methodOrders.reduce((acc, o) => acc + o.total, 0);
            const methodLabel = method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : 'Dinheiro';
            
            return (
              <div key={method} className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{methodLabel}</p>
                <p className="text-xl font-bold">{formatCurrency(methodRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {methodOrders.length} pedido{methodOrders.length !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delivery Modes Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modos de Entrega</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['delivery', 'pickup', 'local'].map(mode => {
            const modeOrders = completedOrders.filter(o => o.deliveryMode === mode);
            const modeRevenue = modeOrders.reduce((acc, o) => acc + o.total, 0);
            const modeLabel = mode === 'delivery' ? 'Entrega' : mode === 'pickup' ? 'Retirada' : 'No Local';
            
            return (
              <div key={mode} className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{modeLabel}</p>
                <p className="text-xl font-bold">{formatCurrency(modeRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {modeOrders.length} pedido{modeOrders.length !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

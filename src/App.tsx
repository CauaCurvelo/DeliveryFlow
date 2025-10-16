import { useState, useEffect, useMemo } from 'react';
import { StoreProvider, useStore } from './contexts/Store';
import { Order, Product } from './mockData';
import { OrderCard } from './components/OrderCard';
import { OrderDetail } from './components/OrderDetail';
import { ProductCard } from './components/ProductCard';
import { MenuEditor } from './components/MenuEditor';
import { WhatsAppStatus } from './components/WhatsAppStatus';
import { BotConfig } from './components/BotConfig';
import { GeneralConfig } from './components/GeneralConfig';
import { TableConfig } from './components/TableConfig';
import { CustomerCard } from './components/CustomerCard';
import { DashboardStats } from './components/DashboardStats';
import { Reports } from './components/Reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Toaster } from './components/ui/sonner';
import { Package, ShoppingBag, Plus, Filter, Settings, Users, Search, Download, BarChart } from 'lucide-react';
import { ConfigPage } from './components/ConfigPage';
import { WhatsAppQRCodeOverlay } from './components/WhatsAppQRCodeOverlay';


function AppContent() {
  const {
    orders,
    products,
    customers,
    deleteCustomer,
    filterStatus,
    setFilterStatus,
    filterMode,
    setFilterMode,
    filterPayment,
    setFilterPayment,
  } = useStore();

  console.log('📊 AppContent: Renderizando com', orders.length, 'pedidos e', products.length, 'produtos e', customers.length, 'clientes');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [tabValue, setTabValue] = useState<string>("orders");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  // Apply dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false;
      if (filterMode !== 'all' && order.deliveryMode !== filterMode) return false;
      if (filterPayment !== 'all' && order.paymentMethod !== filterPayment) return false;
      return true;
    });
  }, [orders, filterStatus, filterMode, filterPayment]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(customer => 
      customer.nome.toLowerCase().includes(searchLower) ||
      customer.telefone.includes(searchLower)
    );
  }, [customers, customerSearch]);

  const activeProducts = products.filter((p: Product) => p.active);
  const inactiveProducts = products.filter((p: Product) => !p.active);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setMenuEditorOpen(true);
  };

  const handleAddProduct = () => {
    console.log('Abrindo modal de novo produto');
    setSelectedProduct(null);
    setMenuEditorOpen(true);
    setTimeout(() => {
      console.log('menuEditorOpen após clique:', menuEditorOpen);
    }, 100);
  };

  const handleExportCustomers = () => {
    // Criar CSV
    const headers = ['Nome', 'Telefone', 'Último Pedido', 'Total de Pedidos'];
    const rows = customers.map(c => [
      c.nome,
      c.telefone,
      new Date(c.ultimoPedido).toLocaleDateString('pt-BR'),
      c.totalPedidos || 0
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const orderStats = {
    pending: orders.filter((o: Order) => o.status === 'pending').length,
    preparing: orders.filter((o: Order) => o.status === 'preparing').length,
    ready: orders.filter((o: Order) => o.status === 'ready').length,
    delivering: orders.filter((o: Order) => o.status === 'delivering').length,
  };

  const totalRevenue = orders
    .filter((o: Order) => o.status !== 'cancelled')
    .reduce((acc, order) => acc + order.total, 0);

  return (
    <>
      {!whatsappConnected && (
        <WhatsAppQRCodeOverlay onConnected={() => setWhatsappConnected(true)} />
      )}
      {whatsappConnected && (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-foreground mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerencie pedidos e cardápio do seu delivery
              </p>
            </div>

            {/* Dashboard Stats */}
            <div className="mb-8">
              <DashboardStats
                totalOrders={orders.length}
                totalRevenue={totalRevenue}
                totalCustomers={customers.length}
                totalProducts={products.filter(p => p.active).length}
                pendingOrders={orderStats.pending}
              />
            </div>

            {/* Quick Stats - Order Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-muted-foreground mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-red-500">{orderStats.pending}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-muted-foreground mb-1">Em Preparo</p>
                <p className="text-2xl font-bold text-yellow-500">{orderStats.preparing}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-muted-foreground mb-1">Prontos</p>
                <p className="text-2xl font-bold text-blue-500">{orderStats.ready}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-muted-foreground mb-1">Saindo</p>
                <p className="text-2xl font-bold text-purple-500">{orderStats.delivering}</p>
              </div>
            </div>

            {/* WhatsApp Status */}
            <WhatsAppStatus className="mb-8" />

            {/* Main Content */}
            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
              <div className="flex w-full justify-center mb-6">
                <TabsList className="flex w-full max-w-3xl justify-center gap-2">
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger value="config" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="flex items-center gap-2">
                    <BarChart className="w-4 h-4" />
                    Relatórios
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="orders" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>Filtros:</span>
                  </div>
                  <Select value={filterStatus} onValueChange={(value: "pending" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled" | "all") => setFilterStatus(value)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="preparing">Em Preparo</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivering">Saindo</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterMode} onValueChange={(value: "all" | "delivery" | "pickup" | "local") => setFilterMode(value)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Modos</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                      <SelectItem value="local">No Local</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPayment} onValueChange={(value: "all" | "pix" | "card" | "cash") => setFilterPayment(value)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Pagamentos</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                  {(filterStatus !== 'all' || filterMode !== 'all' || filterPayment !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterMode('all');
                        setFilterPayment('all');
                      }}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                {/* Orders List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhum pedido encontrado com os filtros selecionados
                    </div>
                  ) : (
                    filteredOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="customers" className="space-y-6">
                {/* Header with Export Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-foreground">Base de Clientes</h2>
                  <Button 
                    onClick={handleExportCustomers} 
                    variant="outline"
                    disabled={customers.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                
                {/* Customer Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-card border border-border rounded-xl">
                  <div>
                    <p className="text-muted-foreground mb-1">Total de Clientes</p>
                    <p className="text-2xl font-bold text-foreground">{customers.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Novos (7 dias)</p>
                    <p className="text-2xl font-bold text-green-500">
                      {customers.filter(c => {
                        const diff = new Date().getTime() - new Date(c.ultimoPedido).getTime();
                        return diff < 7 * 24 * 60 * 60 * 1000;
                      }).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Inativos (30 dias)</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {customers.filter(c => {
                        const diff = new Date().getTime() - new Date(c.ultimoPedido).getTime();
                        return diff > 30 * 24 * 60 * 60 * 1000;
                      }).length}
                    </p>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Customers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCustomers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {customerSearch ? 'Nenhum cliente encontrado com esse critério' : 'Nenhum cliente cadastrado ainda'}
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <CustomerCard
                        key={customer._id}
                        customer={customer}
                        onDelete={deleteCustomer}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="reports" className="space-y-6">
                <Reports orders={orders} />
              </TabsContent>
              <TabsContent value="menu" className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">
                    {activeProducts.length} produtos ativos
                  </p>
                  <Button onClick={handleAddProduct} aria-label="Adicionar Produto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>
                {/* Active Products agrupados por categoria */}
                {activeProducts.length > 0 && (
                  <div>
                    <h2 className="text-foreground mb-4">Produtos Ativos</h2>
                    {Object.entries(
                      activeProducts.reduce((acc: Record<string, Product[]>, product: Product) => {
                        if (!acc[product.category]) acc[product.category] = [];
                        acc[product.category].push(product);
                        return acc;
                      }, {} as Record<string, Product[]>)
                    ).map(([category, products]) => (
                      <div key={category} className="mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {(products as Product[]).map((product: Product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onEdit={handleEditProduct}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Inactive Products */}
                {inactiveProducts.length > 0 && (
                  <div>
                    <h2 className="text-foreground mb-4">Produtos Inativos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {inactiveProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onEdit={handleEditProduct}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {products.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="config" className="space-y-6">
                <ConfigPage />
              </TabsContent>
            </Tabs>
          </div>
          {/* Modals */}
          <OrderDetail
            order={selectedOrder}
            open={orderDetailOpen}
            onClose={() => setOrderDetailOpen(false)}
          />
          <MenuEditor
            product={selectedProduct}
            open={menuEditorOpen}
            onClose={() => {
              setMenuEditorOpen(false);
              setTimeout(() => {
                console.log('menuEditorOpen após fechar:', menuEditorOpen);
              }, 100);
            }}
          />
          <Toaster />
        </div>
      )}
    </>
  );
}

export default function App() {
  console.log('🎨 App: Componente montado');
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

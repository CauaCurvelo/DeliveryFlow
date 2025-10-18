import { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, User, Home, Store, CheckCircle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { formatCurrency } from './lib/utils';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

interface Product {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  ativo: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

type Step = 'welcome' | 'location-choice' | 'table-selection' | 'customer-info' | 'menu' | 'checkout' | 'success';

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [orderType, setOrderType] = useState<'local' | 'delivery' | 'pickup'>('local');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [totalTables, setTotalTables] = useState<number>(20);
  const [taxaEntrega, setTaxaEntrega] = useState<number>(5);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Carregar configuração de mesas
    fetch('http://localhost:4000/api/config/tables')
      .then(res => res.json())
      .then(data => {
        if (data.totalTables) {
          setTotalTables(data.totalTables);
        }
      })
      .catch(err => console.log('Usando 20 mesas como padrão'));
    
    // Carregar configuração de taxa de entrega
    fetch('http://localhost:4000/api/config/delivery')
      .then(res => res.json())
      .then(data => {
        if (data.taxaEntrega !== undefined) {
          setTaxaEntrega(data.taxaEntrega);
        }
      })
      .catch(err => console.log('Usando R$ 5 como taxa padrão'));
  }, []);

  useEffect(() => {
    if (step === 'menu') {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/produtos');
      const data = await response.json();
      setProducts(data.filter((p: Product) => p.ativo));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar cardápio');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.nome} adicionado ao carrinho`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantity: Math.min(99, quantity) } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.preco * item.quantity), 0);
  };

  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    const orderData = {
      nome: customerName,
      telefone: customerPhone,
      texto: `Pedido via app - ${orderType === 'local' ? 'Mesa ' + tableNumber : orderType === 'delivery' ? 'Delivery' : 'Retirada'}`,
      itens: cart.map((item) => ({
        produtoId: item._id,
        nome: item.nome,
        quantidade: item.quantity,
        preco: item.preco,
      })),
      status: 'pending',
      total: getTotalPrice(),
      metodoPagamento: 'pending',
      modoEntrega: orderType,
      endereco: orderType === 'delivery' ? address : orderType === 'local' ? `Mesa ${tableNumber}` : 'Retirada no local',
      observacoes: notes,
      humanTakeover: false,
    };

    try {
      const response = await fetch('http://localhost:4000/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Erro ao criar pedido');

      const data = await response.json();
      setOrderId(data._id);
      setStep('success');
      toast.success('Pedido realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Erro ao processar pedido');
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.categoria]) acc[product.categoria] = [];
    acc[product.categoria].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-red-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
              <ShoppingCart className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">DeliveryFlow</CardTitle>
            <CardDescription className="text-lg">Faça seu pedido de forma rápida e fácil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            <Button onClick={() => setStep('location-choice')} className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg" size="lg">
              🍽️ Começar Pedido
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Atendimento rápido e seguro
            </p>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  if (step === 'location-choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button
            onClick={() => setStep('welcome')}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-4xl font-bold mb-3 text-white">Como deseja receber?</h1>
          <p className="text-gray-400 mb-8 text-lg">Escolha a melhor opção para você</p>

          <div className="grid gap-4">
            <Card className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all border-2 hover:border-orange-500 bg-slate-800/50 backdrop-blur" onClick={() => {
              setOrderType('local');
              setStep('table-selection');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <Store className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Estou no Estabelecimento</CardTitle>
                    <CardDescription className="text-gray-400">Selecione sua mesa e faça o pedido</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all border-2 hover:border-blue-500 bg-slate-800/50 backdrop-blur" onClick={() => {
              setOrderType('delivery');
              setStep('customer-info');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Delivery</CardTitle>
                    <CardDescription className="text-gray-400">Receba em casa com comodidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all border-2 hover:border-green-500 bg-slate-800/50 backdrop-blur" onClick={() => {
              setOrderType('pickup');
              setStep('customer-info');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Retirada</CardTitle>
                    <CardDescription className="text-gray-400">Busque no local e economize</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'table-selection') {
    const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-3xl mx-auto pt-8">
          <button
            onClick={() => setStep('location-choice')}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-4xl font-bold mb-3 text-white">🪑 Selecione sua Mesa</h1>
          <p className="text-gray-400 mb-8 text-lg">Escolha o número da mesa onde você está</p>

          <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mb-8">
            {tables.map(num => (
              <Button
                key={num}
                variant={tableNumber === num.toString() ? 'default' : 'outline'}
                onClick={() => setTableNumber(num.toString())}
                className={`h-20 text-2xl font-bold transition-all ${
                  tableNumber === num.toString()
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 scale-110 shadow-xl'
                    : 'bg-slate-800/50 border-gray-700 hover:bg-slate-700 hover:border-orange-500 text-white'
                }`}
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setStep('customer-info')}
              disabled={!tableNumber}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50"
            >
              Continuar →
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'customer-info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button
            onClick={() => setStep(orderType === 'local' ? 'table-selection' : 'location-choice')}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="text-4xl font-bold mb-3 text-white">Seus Dados</h1>
          <p className="text-gray-400 mb-8 text-lg">Precisamos de algumas informações</p>

          <Card className="bg-slate-800/50 backdrop-blur border-gray-700">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300 text-base">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <Input
                    id="name"
                    placeholder="Digite seu nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-11 h-12 bg-slate-700/50 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300 text-base">WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-12 bg-slate-700/50 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>

              {orderType === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-300 text-base">Endereço Completo *</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua, número, complemento, bairro"
                    className="bg-slate-700/50 border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              {orderType === 'local' && (
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-5 rounded-lg border border-orange-500/30">
                  <p className="text-sm font-medium text-gray-400">Mesa Selecionada</p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">Mesa {tableNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={() => setStep('menu')}
              disabled={!customerName || !customerPhone || (orderType === 'delivery' && !address)}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50"
            >
              Ver Cardápio →
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-32">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-gray-700 z-10 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🍽️ Cardápio</h1>
              <p className="text-gray-400 text-sm">
                {orderType === 'local' ? `Mesa ${tableNumber}` : orderType === 'delivery' ? '🚚 Delivery' : '🏃 Retirada'}
              </p>
            </div>
            <div className="relative">
              <Button onClick={() => setStep('checkout')} size="icon" className="relative bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center p-0 bg-green-500 text-white animate-pulse">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Carregando cardápio...</p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h2 className="text-3xl font-bold mb-5 text-white flex items-center gap-2">
                  <span className="text-orange-500">●</span> {category}
                </h2>
                <div className="grid gap-4">
                  {items.map((product) => (
                    <Card key={product._id} className="overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] bg-slate-800/50 backdrop-blur border-gray-700">
                      <div className="flex gap-4 p-4">
                        <img
                          src={product.imagem}
                          alt={product.nome}
                          className="w-28 h-28 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=🍽️';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-white mb-1">{product.nome}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{product.descricao}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(product.preco)}</p>
                            <Button onClick={() => addToCart(product)} size="sm" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                              + Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-gray-700 p-4 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total do Pedido</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(getTotalPrice())}</p>
              </div>
              <Button onClick={() => setStep('checkout')} size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 h-14 px-8 text-lg">
                🛒 Ver Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </Button>
            </div>
          </div>
        )}
        <Toaster />
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <button
            onClick={() => setStep('menu')}
            className="mb-6 text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar ao cardápio
          </button>
          <h1 className="text-4xl font-bold mb-3 text-white">🛒 Seu Pedido</h1>
          <p className="text-gray-400 mb-8 text-lg">Revise antes de finalizar</p>

          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.nome}</h3>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.preco)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                        -
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                        +
                      </Button>
                    </div>
                    <p className="font-bold w-24 text-right">{formatCurrency(item.preco * item.quantity)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8">
            <CardContent className="p-4 space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Sem cebola, ponto da carne, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(getTotalPrice())}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Entrega</span>
                  <span className="font-semibold">{formatCurrency(taxaEntrega)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-500">{formatCurrency(getTotalPrice() + (orderType === 'delivery' ? taxaEntrega : 0))}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('menu')} className="flex-1">
              Voltar ao Cardápio
            </Button>
            <Button onClick={handleOrderSubmit} className="flex-1" size="lg">
              Finalizar Pedido
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-green-700 mb-2">🎉 Pedido Confirmado!</CardTitle>
            <CardDescription className="text-lg font-semibold text-green-600">
              Pedido #{orderId.slice(-6).toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="bg-green-50 p-5 rounded-lg space-y-3 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">{customerName}</span>
              </div>
              {orderType === 'local' && (
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-green-600" />
                  <span className="text-gray-800 font-medium">Mesa {tableNumber}</span>
                </div>
              )}
              {orderType === 'delivery' && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">{address}</span>
                </div>
              )}
              <div className="pt-3 border-t border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  Total: {formatCurrency(getTotalPrice() + (orderType === 'delivery' ? taxaEntrega : 0))}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                ✨ Seu pedido está sendo preparado!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Você receberá atualizações sobre o status
              </p>
            </div>

            <Button onClick={() => {
              setStep('welcome');
              setCart([]);
              setCustomerName('');
              setCustomerPhone('');
              setAddress('');
              setTableNumber('');
              setNotes('');
            }} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700">
              🍽️ Fazer Novo Pedido
            </Button>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  return null;
}

export default App;

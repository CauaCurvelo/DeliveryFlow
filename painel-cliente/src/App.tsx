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

  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Carregar configuração de mesas
    fetch('/api/config/tables')
      .then(res => res.json())
      .then(data => {
        if (data.totalTables) {
          setTotalTables(data.totalTables);
        }
      })
      .catch(err => console.log('Usando 20 mesas como padrão'));
  }, []);

  useEffect(() => {
    if (step === 'menu') {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/produtos');
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
      items: cart.map((item, idx) => ({
        id: idx.toString(),
        productId: item._id,
        name: item.nome,
        quantity: item.quantity,
        price: item.preco,
      })),
      status: 'pending',
      total: getTotalPrice(),
      paymentMethod: 'pending',
      deliveryMode: orderType,
      address: orderType === 'delivery' ? address : orderType === 'local' ? `Mesa ${tableNumber}` : 'Retirada no local',
      notes: notes,
      humanTakeover: false,
    };

    try {
      const response = await fetch('/api/pedidos', {
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
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl">DeliveryFlow</CardTitle>
            <CardDescription>Faça seu pedido de forma rápida e fácil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setStep('location-choice')} className="w-full h-14 text-lg" size="lg">
              Fazer Pedido
            </Button>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  if (step === 'location-choice') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-3xl font-bold mb-2">Como deseja receber?</h1>
          <p className="text-muted-foreground mb-8">Escolha a melhor opção para você</p>

          <div className="grid gap-4">
            <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => {
              setOrderType('local');
              setStep('table-selection');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Estou no Estabelecimento</CardTitle>
                    <CardDescription>Selecione sua mesa e faça o pedido</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => {
              setOrderType('delivery');
              setStep('customer-info');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Delivery</CardTitle>
                    <CardDescription>Receba em casa com comodidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => {
              setOrderType('pickup');
              setStep('customer-info');
            }}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Retirada</CardTitle>
                    <CardDescription>Busque no local e economize</CardDescription>
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-3xl font-bold mb-2">Selecione sua Mesa</h1>
          <p className="text-muted-foreground mb-8">Escolha o número da mesa onde você está</p>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {tables.map(num => (
              <Button
                key={num}
                variant={tableNumber === num.toString() ? 'default' : 'outline'}
                onClick={() => setTableNumber(num.toString())}
                className="h-16 text-lg"
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('location-choice')} className="flex-1">
              Voltar
            </Button>
            <Button onClick={() => setStep('customer-info')} disabled={!tableNumber} className="flex-1">
              Continuar
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'customer-info') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-3xl font-bold mb-2">Seus Dados</h1>
          <p className="text-muted-foreground mb-8">Precisamos de algumas informações para finalizar</p>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {orderType === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua, número, complemento, bairro"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}

              {orderType === 'local' && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Mesa Selecionada</p>
                  <p className="text-2xl font-bold text-orange-500">Mesa {tableNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={() => setStep(orderType === 'local' ? 'table-selection' : 'location-choice')} className="flex-1">
              Voltar
            </Button>
            <Button
              onClick={() => setStep('menu')}
              disabled={!customerName || !customerPhone || (orderType === 'delivery' && !address)}
              className="flex-1"
            >
              Ver Cardápio
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  if (step === 'menu') {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 bg-background border-b z-10 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Cardápio</h1>
              <p className="text-muted-foreground text-sm">
                {orderType === 'local' ? `Mesa ${tableNumber}` : orderType === 'delivery' ? 'Delivery' : 'Retirada'}
              </p>
            </div>
            <div className="relative">
              <Button onClick={() => setStep('checkout')} size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center p-0 bg-red-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid gap-4">
                {items.map((product) => (
                  <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex gap-4 p-4">
                      <img
                        src={product.imagem}
                        alt={product.nome}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.nome}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.descricao}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-lg font-bold text-green-500">{formatCurrency(product.preco)}</p>
                          <Button onClick={() => addToCart(product)} size="sm">
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalPrice())}</p>
              </div>
              <Button onClick={() => setStep('checkout')} size="lg">
                Ver Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-3xl font-bold mb-2">Seu Pedido</h1>
          <p className="text-muted-foreground mb-8">Revise antes de finalizar</p>

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
                  <span className="font-semibold">{formatCurrency(5)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-500">{formatCurrency(getTotalPrice() + (orderType === 'delivery' ? 5 : 0))}</span>
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
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl">Pedido Confirmado!</CardTitle>
            <CardDescription>
              Pedido #{orderId.slice(-6)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{customerName}</span>
              </div>
              {orderType === 'local' && (
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <span>Mesa {tableNumber}</span>
                </div>
              )}
              {orderType === 'delivery' && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{address}</span>
                </div>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Você receberá atualizações sobre o status do seu pedido
            </div>

            <Button onClick={() => {
              setStep('welcome');
              setCart([]);
              setCustomerName('');
              setCustomerPhone('');
              setAddress('');
              setTableNumber('');
              setNotes('');
            }} className="w-full">
              Fazer Novo Pedido
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

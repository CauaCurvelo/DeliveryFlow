import { Order } from '../mockData';
import { useStore } from '../contexts/Store';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Clock, MapPin, Phone, CreditCard, MessageSquare, AlertCircle, Store, Bike } from 'lucide-react';
import { HumanTakeover } from './HumanTakeover';

interface OrderDetailProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  preparing: { label: 'Em Preparo', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  ready: { label: 'Pronto', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  delivering: { label: 'Saiu para Entrega', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const paymentConfig = {
  pix: { label: 'PIX', icon: CreditCard },
  card: { label: 'Cartão de Crédito/Débito', icon: CreditCard },
  cash: { label: 'Dinheiro', icon: CreditCard },
  pending: { label: 'Pendente', icon: CreditCard },
};

export function OrderDetail({ order, open, onClose }: OrderDetailProps) {
  const { updateOrderStatus, updateOrder, deleteOrder } = useStore();

  if (!order) return null;

  try {
    // Proteção extra: garantir que todos campos existem
    const safeOrder = {
      id: order.id || '',
      customerName: order.customerName || 'Cliente WhatsApp',
      customerPhone: order.customerPhone || '',
      items: Array.isArray(order.items) ? order.items.map(item => ({
        id: item?.id || '',
        productId: item?.productId || '',
        name: item?.name && item.name.trim() !== '' ? item.name : 'Produto não identificado',
        quantity: typeof item?.quantity === 'number' ? item.quantity : 1,
        price: typeof item?.price === 'number' ? item.price : 0,
        notes: item?.notes || '',
      })) : [],
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'pix',
      deliveryMode: order.deliveryMode || 'delivery',
      address: order.address || '',
      notes: order.notes || '',
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
      humanTakeover: !!order.humanTakeover,
      total: typeof order.total === 'number' ? order.total : 0,
    };

    // Detecta campos incompletos
    const missingFields: string[] = [];
    if (!order.id) missingFields.push('ID do pedido');
    if (!order.customerName) missingFields.push('Nome do cliente');
    if (!order.customerPhone) missingFields.push('Telefone do cliente');
    if (!Array.isArray(order.items) || order.items.length === 0) missingFields.push('Itens do pedido');
    if (typeof order.total !== 'number') missingFields.push('Total do pedido');
    // Checa cada item
    let isInvalid = false;
    if (Array.isArray(order.items)) {
      order.items.forEach((item, idx) => {
        if (!item || !item.name) {
          missingFields.push(`Nome do produto (${idx + 1})`);
          isInvalid = true;
        }
        if (typeof item?.quantity !== 'number') missingFields.push(`Quantidade (${idx + 1})`);
        if (typeof item?.price !== 'number' || item.price === 0) {
          missingFields.push(`Preço (${idx + 1})`);
          isInvalid = true;
        }
      });
    }

    const statusFlow: Order['status'][] = ['pending', 'preparing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statusFlow.indexOf(safeOrder.status);

    const nextStatus = () => {
      if (currentIndex < statusFlow.length - 1) {
        updateOrderStatus(safeOrder.id, statusFlow[currentIndex + 1]);
      }
    };

    const prevStatus = () => {
      if (currentIndex > 0) {
        updateOrderStatus(safeOrder.id, statusFlow[currentIndex - 1]);
      }
    };

    const toggleHumanTakeover = () => {
      updateOrder(safeOrder.id, { humanTakeover: !safeOrder.humanTakeover });
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Pedido {safeOrder.id}</span>
              <Badge className={statusConfig[safeOrder.status].color}>
                {statusConfig[safeOrder.status].label}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          {missingFields.length > 0 && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2">Campos incompletos ou inválidos:</h3>
              <ul className="list-disc pl-5">
                {missingFields.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">O pedido pode ser exibido, mas alguns dados estão faltando ou incorretos.</p>
            </div>
          )}

          {/* Cliente */}
          <div>
            <h3 className="text-muted-foreground mb-2">Cliente</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className={`text-foreground ${!order.customerName ? 'text-red-500' : ''}`}>{safeOrder.customerName}</p>
              <p className={`text-muted-foreground flex items-center gap-2 ${!order.customerPhone ? 'text-red-500' : ''}`}>
                <Phone className="w-4 h-4" />
                {safeOrder.customerPhone}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-muted-foreground mb-2">Itens do Pedido</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {safeOrder.items.map((item, idx) => {
                const isInvalid = !item.name || item.name === 'Produto não identificado' || !item.productId || item.price === 0;
                return (
                  <div key={item.id || idx} className={`flex justify-between ${isInvalid ? 'bg-red-50 border border-red-300 rounded-lg p-2' : ''}`}>
                    <div>
                      <p className={`text-foreground ${isInvalid ? 'text-red-600 font-bold' : ''}`}>
                        {(item.quantity || 1)}x {item.name || 'Produto'}
                        {isInvalid && (
                          <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">Inválido</span>
                        )}
                      </p>
                      {item.notes && (
                        <p className="text-muted-foreground text-xs">{item.notes}</p>
                      )}
                    </div>
                    <div className={`text-muted-foreground ${isInvalid ? 'text-red-600 font-bold' : ''}`}> 
                      R$ {(typeof item.price === 'number' ? item.price : 0).toFixed(2)}
                    </div>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between">
                <p>Total</p>
                <p className={typeof safeOrder.total !== 'number' ? 'text-red-500' : ''}>
                  R$ {(typeof safeOrder.total === 'number' ? safeOrder.total : 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Pagamento e Entrega */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-muted-foreground mb-2">Pagamento</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {paymentConfig[safeOrder.paymentMethod].label}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-2">Tipo</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                {safeOrder.deliveryMode === 'local' ? (
                  <div className="flex items-center gap-2 text-orange-500">
                    <Store className="w-4 h-4" />
                    <span>No Local</span>
                    {safeOrder.address && (
                      <span className="ml-2 px-2 py-1 rounded bg-orange-500/10 text-orange-600 font-bold border border-orange-500/20">MESA {safeOrder.address}</span>
                    )}
                  </div>
                ) : safeOrder.deliveryMode === 'delivery' ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bike className="w-4 h-4" />
                    <span>Entrega</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Retirada</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          {safeOrder.address && (
            <div>
              <h3 className="text-muted-foreground mb-2">Endereço</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-foreground flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  {safeOrder.address}
                </p>
              </div>
            </div>
          )}

          {/* Observações */}
          {safeOrder.notes && (
            <div>
              <h3 className="text-muted-foreground mb-2">Observações</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-foreground flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-1" />
                  {safeOrder.notes}
                </p>
              </div>
            </div>
          )}

          {/* Horários */}
          <div>
            <h3 className="text-muted-foreground mb-2">Horários</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Criado: {formatDate(safeOrder.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Atualizado: {formatDate(safeOrder.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Atendimento Humano */}
          {safeOrder.humanTakeover && <HumanTakeover order={safeOrder} />}

          {/* Ações */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-2">
              {currentIndex > 0 && safeOrder.status !== 'delivered' && safeOrder.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  onClick={prevStatus}
                  className="flex-1"
                >
                  Voltar Status
                </Button>
              )}
              {currentIndex < statusFlow.length - 1 && (
                <Button
                  onClick={nextStatus}
                  className="flex-1"
                >
                  {statusConfig[statusFlow[currentIndex + 1]].label}
                </Button>
              )}
            </div>
            {isInvalid && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="destructive"
                  onClick={() => deleteOrder(safeOrder.id)}
                  className="flex-1"
                >
                  Excluir pedido inválido
                </Button>
              </div>
            )}
            {!isInvalid && safeOrder.status !== 'delivered' && safeOrder.status !== 'cancelled' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleHumanTakeover}
                  className="flex-1"
                >
                  {safeOrder.humanTakeover ? (
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Desativar Atendimento
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Atendimento Humano
                    </span>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateOrderStatus(safeOrder.id, 'cancelled')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  } catch (err) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center text-red-500">
            <div>
              <h2 className="text-lg font-bold mb-2">Erro ao exibir pedido</h2>
              <p>O pedido possui dados inválidos ou ocorreu um erro inesperado.<br />Veja os dados brutos abaixo para diagnóstico:</p>
              <pre className="bg-red-50 text-xs text-left p-2 rounded mt-4 max-h-64 overflow-auto w-full">
                {JSON.stringify(order, null, 2)}
              </pre>
            </div>
          </div>
          <div className="p-4">
            <Button
              variant="destructive"
              onClick={() => {
                deleteOrder(order?.id || '');
                onClose();
              }}
              className="w-full"
            >
              Excluir pedido inválido
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
}

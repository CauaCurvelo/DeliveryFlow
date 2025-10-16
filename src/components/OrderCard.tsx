import { Order } from '../mockData';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, MapPin, Bike, Phone, AlertCircle, Store } from 'lucide-react';
import { useStore } from '../contexts/Store';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  preparing: { label: 'Preparo', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  ready: { label: 'Pronto', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  delivering: { label: 'Entregando', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const paymentConfig = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
  pending: 'Pendente',
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { updateOrderStatus } = useStore();
  
  // Proteção contra pedidos com dados inválidos
  if (!order || typeof order !== 'object') {
    return (
      <div className="bg-card border border-red-500 rounded-xl p-4">
        <p className="text-red-500">Erro: Pedido inválido</p>
      </div>
    );
  }

  try {
    // Fallback seguro para campos essenciais
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
    createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || Date.now()),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt || Date.now()),
    humanTakeover: !!order.humanTakeover,
    total: typeof order.total === 'number' ? order.total : 0,
  };

  const timeAgo = () => {
    let createdDate = safeOrder.createdAt;
    if (!(createdDate instanceof Date) || isNaN(createdDate.getTime())) {
      createdDate = new Date();
    }
    const minutes = Math.floor((Date.now() - createdDate.getTime()) / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };
  // Detecta pedido inválido
  const isInvalid = (safeOrder.items || []).some(item => !item.name || item.price === 0);
  const isLocal = safeOrder.deliveryMode === 'local';

  return (
    <div
      onClick={onClick}
      className={`bg-card border ${isLocal ? 'border-orange-500/50 bg-orange-500/5' : 'border-border'} rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden group`}
    >
      {safeOrder.humanTakeover && (
        <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
      )}
      {isLocal && (
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
      )}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-foreground">{safeOrder.customerName}</h3>
              {safeOrder.humanTakeover && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {safeOrder.customerPhone}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={isInvalid ? 'bg-red-600/10 text-red-600 border-red-600/20' : statusConfig[safeOrder.status].color}>
              {isInvalid ? 'INVALIDO' : statusConfig[safeOrder.status].label}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo()}
            </span>
          </div>
        </div>
        <div className="space-y-1 mb-3">
          {(safeOrder.items || []).map((item, idx) => (
            <div key={item.id || idx} className="text-foreground/80">
              {item.quantity || 1}x {item.name || 'Produto'}
            </div>
          ))}
          {safeOrder.deliveryMode === 'local' && safeOrder.address && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 mt-2">
              <Store className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div>
                <div className="text-xs text-orange-600 font-semibold">MESA</div>
                <div className="text-orange-500 font-bold text-lg">{safeOrder.address}</div>
              </div>
            </div>
          )}
          {safeOrder.deliveryMode === 'delivery' && safeOrder.address && (
            <div className="flex items-start gap-1 text-muted-foreground text-sm mt-2 pt-2 border-t border-border">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{safeOrder.address}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {paymentConfig[safeOrder.paymentMethod] || 'Pendente'}
            </Badge>
            {safeOrder.deliveryMode === 'delivery' ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bike className="w-4 h-4" />
                <span>Entrega</span>
              </div>
            ) : safeOrder.deliveryMode === 'local' ? (
              <div className="flex items-center gap-1 text-orange-500">
                <Store className="w-4 h-4" />
                <span>No Local</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Retirada</span>
              </div>
            )}
          </div>
          <div className="text-foreground">
            R$ {safeOrder.total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Erro ao renderizar OrderCard:', error, order);
    return (
      <div className="bg-card border border-red-500 rounded-xl p-4">
        <p className="text-red-500 font-semibold">Erro ao carregar pedido</p>
        <p className="text-sm text-muted-foreground">ID: {order?.id || 'desconhecido'}</p>
      </div>
    );
  }
}

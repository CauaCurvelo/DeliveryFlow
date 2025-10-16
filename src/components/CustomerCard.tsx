import { User, Phone, Calendar, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Customer } from '../contexts/Store';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

export function CustomerCard({ customer, onClick, onDelete }: CustomerCardProps) {
  const formatPhone = (phone: string) => {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as (XX) XXXXX-XXXX
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
    return `${Math.floor(days / 365)} anos atrás`;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Deseja realmente excluir ${customer.nome}?`)) {
      onDelete(customer._id);
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all hover:border-primary/50 group relative">
      <div className="space-y-3" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{customer.nome}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatPhone(customer.telefone)}
              </p>
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(customer.ultimoPedido)}
          </div>
          {customer.totalPedidos && (
            <Badge variant="secondary">
              {customer.totalPedidos} {customer.totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

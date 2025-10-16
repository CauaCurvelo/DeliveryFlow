import { Product } from '../mockData';
import { useStore } from '../contexts/Store';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const { toggleProductActive, deleteProduct } = useStore();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {!product.active && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">Inativo</Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-sm font-medium text-foreground" role="heading" aria-level={3}>{product.name}</h3>
            <Badge variant="outline" className="ml-2 text-xs">
              {product.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-sm font-semibold text-foreground">
            R$ {product.price.toFixed(2)}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={product.active}
              onCheckedChange={() => toggleProductActive(product.id)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1 h-8 text-xs"
            aria-label="Editar Produto"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este produto?')) {
                deleteProduct(product.id);
              }
            }}
            className="h-8"
            aria-label="Excluir Produto"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Product } from '../mockData';
import { useStore } from '../contexts/Store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface MenuEditorProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function MenuEditor({ product, open, onClose }: MenuEditorProps) {
  console.log('MenuEditor renderizado, open:', open);
  const { addProduct, updateProduct } = useStore();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    image: product?.image || '',
    active: product?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && product) {
      updateProduct(product.id, formData);
    } else {
      addProduct(formData);
    }

    console.log('onClose called');
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      active: true,
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Atualiza o formulário quando o produto muda
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        active: product.active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        image: '',
        active: true,
      });
    }
  }, [product]);

  return (
  <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
    <DialogContent className="sm:max-w-lg" aria-describedby="menu-editor-description">
        <DialogDescription id="menu-editor-description" className="mt-1">
          Preencha os dados do produto para adicionar ou editar no cardápio.
        </DialogDescription>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

  <form onSubmit={handleSubmit} className="space-y-4" role="form">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pizza Margherita"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o produto..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Pizzas"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL da Imagem</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              required
            />
            {formData.image && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <Label htmlFor="active" className="cursor-pointer">
              Produto Ativo
            </Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

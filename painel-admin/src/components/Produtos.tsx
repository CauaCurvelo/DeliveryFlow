import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Package, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ProdutosProps {
  socket: Socket | null;
}

interface Produto {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  ativo: boolean;
}

interface FormData {
  nome: string;
  descricao: string;
  preco: string;
  categoria: string;
  imagem: string;
  ativo: boolean;
}

export default function Produtos({ socket }: ProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'nome' | 'preco-asc' | 'preco-desc' | 'categoria'>('nome');
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    imagem: '',
    ativo: true,
  });
  const [editForms, setEditForms] = useState<Record<string, FormData>>({});

  const fetchProdutos = async () => {
    try {
      const API_URL = 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/produtos`);
      const data = await res.json();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('produto-criado', fetchProdutos);
      socket.on('produto-atualizado', fetchProdutos);
      
      return () => {
        socket.off('produto-criado', fetchProdutos);
        socket.off('produto-atualizado', fetchProdutos);
      };
    }
  }, [socket]);

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      categoria: '',
      imagem: '',
      ativo: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      preco: parseFloat(formData.preco),
    };

    try {
      const API_URL = 'http://localhost:3000';
      const url = editingId 
        ? `${API_URL}/api/produtos/${editingId}`
        : `${API_URL}/api/produtos`;
      
      const method = editingId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success(editingId ? 'Produto atualizado!' : 'Produto criado!');
      resetForm();
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditForms({
      ...editForms,
      [produto._id]: {
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco.toString(),
        categoria: produto.categoria,
        imagem: produto.imagem,
        ativo: produto.ativo,
      }
    });
    setEditingId(produto._id);
  };

  const cancelEdit = (id: string) => {
    const { [id]: removed, ...rest } = editForms;
    setEditForms(rest);
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const form = editForms[id];
    if (!form) return;

    const payload = {
      ...form,
      preco: parseFloat(form.preco),
    };

    try {
      const API_URL = 'http://localhost:3000';
      await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success('Produto atualizado!');
      cancelEdit(id);
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const updateEditForm = (id: string, field: keyof FormData, value: any) => {
    setEditForms({
      ...editForms,
      [id]: {
        ...editForms[id],
        [field]: value
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const API_URL = 'http://localhost:3000';
      await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'DELETE',
      });
      toast.success('Produto excluído!');
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const API_URL = 'http://localhost:3000';
      await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      });
      toast.success(ativo ? 'Produto desativado' : 'Produto ativado');
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  const sortedProdutos = [...produtos].sort((a, b) => {
    switch (sortBy) {
      case 'nome':
        return a.nome.localeCompare(b.nome);
      case 'preco-asc':
        return a.preco - b.preco;
      case 'preco-desc':
        return b.preco - a.preco;
      case 'categoria':
        return (a.categoria || '').localeCompare(b.categoria || '');
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Produtos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie o catálogo de produtos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ordenar por:</span>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sortBy === 'nome' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('nome')}
          >
            Nome (A-Z)
          </Button>
          <Button
            variant={sortBy === 'preco-asc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('preco-asc')}
          >
            Preço (Menor)
          </Button>
          <Button
            variant={sortBy === 'preco-desc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('preco-desc')}
          >
            Preço (Maior)
          </Button>
          <Button
            variant={sortBy === 'categoria' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('categoria')}
          >
            Categoria
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{editingId ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome" className="dark:text-gray-300">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="preco" className="dark:text-gray-300">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao" className="dark:text-gray-300">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria" className="dark:text-gray-300">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="imagem" className="dark:text-gray-300">URL da Imagem</Label>
                  <Input
                    id="imagem"
                    value={formData.imagem}
                    onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
                    placeholder="https://..."
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 dark:bg-gray-700 dark:border-gray-600"
                />
                <Label htmlFor="ativo" className="dark:text-gray-300">Produto ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Produto
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtos.length === 0 ? (
          <Card className="col-span-full dark:bg-gray-800">
            <CardContent className="py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhum produto cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          sortedProdutos.map((produto) => {
            const isEditing = editingId === produto._id;
            const form = editForms[produto._id];

            return (
              <Card key={produto._id} className={`${!produto.ativo ? 'opacity-60' : ''} hover:shadow-lg transition-shadow dark:bg-gray-800`}>
                <CardContent className="p-4">
                  {isEditing && form ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs dark:text-gray-300">Imagem URL</Label>
                        <Input
                          value={form.imagem}
                          onChange={(e) => updateEditForm(produto._id, 'imagem', e.target.value)}
                          placeholder="https://..."
                          className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      {form.imagem ? (
                        <img
                          src={form.imagem}
                          alt={form.nome}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs dark:text-gray-300">Nome</Label>
                        <Input
                          value={form.nome}
                          onChange={(e) => updateEditForm(produto._id, 'nome', e.target.value)}
                          className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-xs dark:text-gray-300">Descrição</Label>
                        <Textarea
                          value={form.descricao}
                          onChange={(e) => updateEditForm(produto._id, 'descricao', e.target.value)}
                          rows={2}
                          className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs dark:text-gray-300">Categoria</Label>
                          <Input
                            value={form.categoria}
                            onChange={(e) => updateEditForm(produto._id, 'categoria', e.target.value)}
                            className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs dark:text-gray-300">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.preco}
                            onChange={(e) => updateEditForm(produto._id, 'preco', e.target.value)}
                            className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.ativo}
                          onChange={(e) => updateEditForm(produto._id, 'ativo', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label className="text-sm dark:text-gray-300">Produto ativo</Label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(produto._id)}
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEdit(produto._id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg dark:text-white">{produto.nome}</h3>
                          <Badge variant={produto.ativo ? 'default' : 'secondary'}>
                            {produto.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        {produto.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{produto.descricao}</p>
                        )}

                        {produto.categoria && (
                          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                            {produto.categoria}
                          </Badge>
                        )}

                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          R$ {produto.preco.toFixed(2)}
                        </p>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(produto)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant={produto.ativo ? 'outline' : 'default'}
                            onClick={() => toggleAtivo(produto._id, produto.ativo)}
                          >
                            {produto.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(produto._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


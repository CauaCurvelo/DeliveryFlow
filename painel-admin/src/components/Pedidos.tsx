import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Clock, CheckCircle, XCircle, AlertCircle, Package as PackageIcon, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PedidosProps {
  socket: Socket | null;
}

interface Pedido {
  _id: string;
  nome: string;
  telefone: string;
  itens: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    preco: number;
  }>;
  status: string;
  total: number;
  metodoPagamento: string;
  modoEntrega: string;
  endereco?: string;
  observacoes?: string;
  criadoEm: string;
}

export default function Pedidos({ socket }: PedidosProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Pedido | null>(null);

  const fetchPedidos = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/pedidos`);
      const data = await res.json();
      setPedidos(data.sort((a: Pedido, b: Pedido) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      ));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('novo-pedido', fetchPedidos);
      socket.on('pedido-atualizado', fetchPedidos);
      socket.on('pedido-cancelado', fetchPedidos);
      
      return () => {
        socket.off('novo-pedido', fetchPedidos);
        socket.off('pedido-atualizado', fetchPedidos);
        socket.off('pedido-cancelado', fetchPedidos);
      };
    }
  }, [socket]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const API_URL = 'http://localhost:4000';
      await fetch(`${API_URL}/api/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success('Status atualizado!');
      fetchPedidos();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    try {
      const API_URL = 'http://localhost:4000';
      await fetch(`${API_URL}/api/pedidos/${id}`, {
        method: 'DELETE',
      });
      toast.success('Pedido cancelado!');
      fetchPedidos();
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    }
  };

  const startEditing = (pedido: Pedido) => {
    setEditingId(pedido._id);
    setEditForm({ ...pedido });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm || !editingId) return;

    // Validação
    try {
      if (!editForm.nome?.trim()) {
        toast.error('Nome do cliente é obrigatório');
        return;
      }
      if (!editForm.telefone?.trim()) {
        toast.error('Telefone é obrigatório');
        return;
      }
      if (!editForm.itens || editForm.itens.length === 0) {
        toast.error('Pedido deve ter pelo menos um item');
        return;
      }
      if (editForm.total <= 0) {
        toast.error('Total do pedido inválido');
        return;
      }

      const API_URL = 'http://localhost:4000';
      await fetch(`${API_URL}/api/pedidos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      toast.success('Pedido atualizado com sucesso!');
      setEditingId(null);
      setEditForm(null);
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao salvar alterações');
    }
  };

  const updateItemQuantity = (index: number, quantidade: number) => {
    if (!editForm) return;
    if (quantidade < 1) {
      toast.error('Quantidade deve ser pelo menos 1');
      return;
    }

    const newItens = [...editForm.itens];
    newItens[index] = { ...newItens[index], quantidade };
    
    const newTotal = newItens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    
    setEditForm({ ...editForm, itens: newItens, total: newTotal });
  };

  const removeItem = (index: number) => {
    if (!editForm) return;
    if (editForm.itens.length <= 1) {
      toast.error('Pedido deve ter pelo menos um item');
      return;
    }

    const newItens = editForm.itens.filter((_, i) => i !== index);
    const newTotal = newItens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    
    setEditForm({ ...editForm, itens: newItens, total: newTotal });
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
    preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: PackageIcon },
    ready: { label: 'Pronto', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  };

  const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

  const filteredPedidos = filter === 'all' 
    ? pedidos 
    : pedidos.filter(p => p.status === filter);

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie todos os pedidos do sistema</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todos ({pedidos.length})
        </Button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = pedidos.filter(p => p.status === key).length;
          return (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key)}
              size="sm"
            >
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredPedidos.length === 0 ? (
          <Card className="dark:bg-gray-800">
            <CardContent className="py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredPedidos.map((pedido) => {
            const StatusIcon = statusConfig[pedido.status]?.icon || AlertCircle;
            return (
              <Card key={pedido._id} className="border-2 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingId === pedido._id && editForm ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs dark:text-gray-300">Nome</Label>
                              <Input
                                value={editForm.nome}
                                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                                className="h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs dark:text-gray-300">Telefone</Label>
                              <Input
                                value={editForm.telefone}
                                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                                className="h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-lg dark:text-white">{pedido.nome}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pedido.telefone}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(pedido.criadoEm).toLocaleString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === pedido._id ? (
                        <>
                          <Button size="sm" onClick={saveEdit} className="h-8">
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing} className="h-8">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(pedido)}
                            className="h-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Badge className={`${statusConfig[pedido.status]?.color} border flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[pedido.status]?.label}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-2 dark:text-white">Itens:</h4>
                    <div className="space-y-1">
                      {editingId === pedido._id && editForm ? (
                        editForm.itens.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded gap-2">
                            <span className="dark:text-gray-300 flex-1">{item.nome}</span>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                              className="w-16 h-7 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            />
                            <span className="font-medium dark:text-white w-20 text-right">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(idx)}
                              className="h-7 w-7 p-0"
                              disabled={editForm.itens.length <= 1}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        pedido.itens.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="dark:text-gray-300">{item.quantidade}x {item.nome}</span>
                            <span className="font-medium dark:text-white">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Entrega:</span>
                      <span className="ml-2 font-medium dark:text-white">
                        {editingId === pedido._id && editForm ? editForm.modoEntrega : pedido.modoEntrega}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pagamento:</span>
                      <span className="ml-2 font-medium dark:text-white">
                        {editingId === pedido._id && editForm ? editForm.metodoPagamento : pedido.metodoPagamento}
                      </span>
                    </div>
                  </div>

                  {(pedido.endereco || (editingId === pedido._id && editForm?.endereco)) && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                      {editingId === pedido._id && editForm ? (
                        <Textarea
                          value={editForm.endereco || ''}
                          onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={2}
                        />
                      ) : (
                        <p className="mt-1 dark:text-gray-300">{pedido.endereco}</p>
                      )}
                    </div>
                  )}

                  {(pedido.observacoes || (editingId === pedido._id && editForm?.observacoes)) && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Observações:</span>
                      {editingId === pedido._id && editForm ? (
                        <Textarea
                          value={editForm.observacoes || ''}
                          onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={2}
                        />
                      ) : (
                        <p className="mt-1 italic dark:text-gray-300">{pedido.observacoes}</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                    <span className="text-xl font-bold dark:text-white">
                      Total: R$ {editingId === pedido._id && editForm ? editForm.total.toFixed(2) : pedido.total.toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      {editingId !== pedido._id && pedido.status !== 'cancelled' && pedido.status !== 'delivered' && (
                        <>
                          {statusOptions.map((status) => {
                            const currentIndex = statusOptions.indexOf(pedido.status);
                            const statusIndex = statusOptions.indexOf(status);
                            if (statusIndex > currentIndex) {
                              return (
                                <Button
                                  key={status}
                                  size="sm"
                                  onClick={() => updateStatus(pedido._id, status)}
                                  variant="outline"
                                >
                                  {statusConfig[status].label}
                                </Button>
                              );
                            }
                            return null;
                          })}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelOrder(pedido._id)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

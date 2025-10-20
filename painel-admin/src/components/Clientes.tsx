import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Users, Trash2, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

interface ClientesProps {
  socket: Socket | null;
}

interface Cliente {
  _id: string;
  nome: string;
  telefone: string;
  criadoEm: string;
}

export default function Clientes({ }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const API_URL = 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/clientes`);
      const data = await res.json();
      setClientes(data.sort((a: Cliente, b: Cliente) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      ));
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      const API_URL = 'http://localhost:3000';
      await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'DELETE',
      });
      toast.success('Cliente excluído!');
      fetchClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie a base de clientes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-blue-900 dark:text-blue-300">{clientes.length} clientes</span>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4">
        {clientes.length === 0 ? (
          <Card className="dark:bg-gray-800">
            <CardContent className="py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          clientes.map((cliente) => (
            <Card key={cliente._id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg dark:text-white">{cliente.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">{cliente.telefone}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Cadastrado em {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(cliente._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import Dashboard from './components/Dashboard';
import Pedidos from './components/Pedidos';
import Produtos from './components/Produtos';
import Clientes from './components/Clientes';
import Configuracoes from './components/Configuracoes';
import { LayoutDashboard, ShoppingBag, Package, Users, Settings } from 'lucide-react';
import { SOCKET_URL } from './config/api';

type Page = 'dashboard' | 'pedidos' | 'produtos' | 'clientes' | 'configuracoes';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Carregar dark mode do localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Conectar ao Socket.IO
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Conectado ao servidor');
      setIsConnected(true);
      toast.success('Conectado ao servidor');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
      setIsConnected(false);
      toast.error('Desconectado do servidor');
    });

    socketInstance.on('novo-pedido', (pedido) => {
      const notificacoesAtivas = localStorage.getItem('notificacoesAtivas') !== 'false';
      if (notificacoesAtivas) {
        toast.success(`Novo pedido de ${pedido.nome}!`, {
          description: `Total: R$ ${pedido.total?.toFixed(2)}`,
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DeliveryFlow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-8">
          {currentPage === 'dashboard' && <Dashboard socket={socket} />}
          {currentPage === 'pedidos' && <Pedidos socket={socket} />}
          {currentPage === 'produtos' && <Produtos socket={socket} />}
          {currentPage === 'clientes' && <Clientes socket={socket} />}
          {currentPage === 'configuracoes' && <Configuracoes socket={socket} onDarkModeChange={setDarkMode} />}
        </div>
      </main>
    </div>
  );
}

export default App;
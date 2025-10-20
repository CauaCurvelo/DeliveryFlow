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
  const [whatsappQR, setWhatsappQR] = useState<string | null>(null);
  const [whatsappReady, setWhatsappReady] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Conectado ao servidor');
      setIsConnected(true);
      toast.success('Conectado ao servidor');
      
      fetch(`${SOCKET_URL}/api/whatsapp/status`)
        .then(res => res.json())
        .then(data => {
          if (data.connected) {
            setWhatsappReady(true);
            setWhatsappQR(null);
          }
        })
        .catch(err => console.error('Erro ao verificar status do WhatsApp:', err));
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

    socketInstance.on('whatsapp-qr', (qr: string) => {
      console.log('📱 QR Code do WhatsApp recebido');
      setWhatsappQR(qr);
      setWhatsappReady(false);
    });

    socketInstance.on('whatsapp-authenticated', () => {
      console.log('✅ WhatsApp autenticado');
      setWhatsappQR(null);
    });

    socketInstance.on('whatsapp-ready', () => {
      console.log('✅ WhatsApp pronto');
      setWhatsappQR(null);
      setWhatsappReady(true);
      toast.success('WhatsApp conectado!');
    });

    socketInstance.on('whatsapp-disconnected', () => {
      console.log('❌ WhatsApp desconectado');
      setWhatsappReady(false);
      toast.warning('WhatsApp desconectado');
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
      
      {whatsappQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Conectar WhatsApp
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Escaneie o QR Code abaixo com seu WhatsApp para conectar o bot
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappQR)}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64"
              />
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 text-left">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p>Abra o WhatsApp no seu celular</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p>Toque em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p>Toque em <strong>Conectar um aparelho</strong> e escaneie este código</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Aguardando conexão...</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
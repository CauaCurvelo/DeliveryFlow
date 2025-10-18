import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings as SettingsIcon, Clock, Save, Bot, Moon, Sun, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguracoesProps {
  socket: Socket | null;
  onDarkModeChange?: (value: boolean) => void;
}

interface BotConfig {
  horarioFuncionamento: {
    inicio: string;
    fim: string;
    diasFuncionamento: string[];
  };
}

interface TableConfig {
  habilitarMesas: boolean;
  numeroMesas: number;
}

interface DeliveryConfig {
  taxaEntrega: number;
}

export default function Configuracoes({ onDarkModeChange }: ConfiguracoesProps) {
  const [botConfig, setBotConfig] = useState<BotConfig>({
    horarioFuncionamento: {
      inicio: '08:00',
      fim: '22:00',
      diasFuncionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    },
  });

  const [tableConfig, setTableConfig] = useState<TableConfig>({
    habilitarMesas: false,
    numeroMesas: 10,
  });

  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    taxaEntrega: 5,
  });

  const [botAtivo, setBotAtivo] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [loading, setLoading] = useState(true);

  const diasSemana = [
    { value: 'domingo', label: 'Domingo' },
    { value: 'segunda', label: 'Segunda' },
    { value: 'terca', label: 'Terça' },
    { value: 'quarta', label: 'Quarta' },
    { value: 'quinta', label: 'Quinta' },
    { value: 'sexta', label: 'Sexta' },
    { value: 'sabado', label: 'Sábado' },
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedNotifications = localStorage.getItem('notificacoesAtivas') !== 'false';
    setDarkMode(savedDarkMode);
    setNotificacoesAtivas(savedNotifications);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchConfigs = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      const [botRes, tableRes, generalRes, deliveryRes] = await Promise.all([
        fetch(`${API_URL}/api/config/bot`),
        fetch(`${API_URL}/api/config/tables`),
        fetch(`${API_URL}/api/config/general`),
        fetch(`${API_URL}/api/config/delivery`).catch(() => null),
      ]);

      const botData = await botRes.json();
      const tableData = await tableRes.json();
      const generalData = await generalRes.json();
      const deliveryData = deliveryRes ? await deliveryRes.json() : null;

      if (botData.horarioFuncionamento) {
        setBotConfig(botData);
      }
      if (tableData) {
        setTableConfig({
          habilitarMesas: tableData.habilitarMesas !== undefined ? tableData.habilitarMesas : false,
          numeroMesas: tableData.totalTables || tableData.numeroMesas || 10
        });
      }
      if (generalData) {
        setBotAtivo(generalData.botAtivo || false);
      }
      if (deliveryData && deliveryData.taxaEntrega !== undefined) {
        setDeliveryConfig(deliveryData);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveBotConfig = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      await fetch(`${API_URL}/api/config/bot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig),
      });
      toast.success('Configurações do bot salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const saveTableConfig = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      // Mapear numeroMesas de volta para totalTables para a API
      const dataToSend = {
        habilitarMesas: tableConfig.habilitarMesas,
        totalTables: tableConfig.numeroMesas
      };
      await fetch(`${API_URL}/api/config/tables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      toast.success('Configurações de mesas salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const saveDeliveryConfig = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      await fetch(`${API_URL}/api/config/delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryConfig),
      });
      toast.success('Taxa de entrega salva!');
    } catch (error) {
      toast.error('Erro ao salvar taxa de entrega');
    }
  };

  const toggleBot = async () => {
    try {
      const API_URL = 'http://localhost:4000';
      const newStatus = !botAtivo;
      await fetch(`${API_URL}/api/config/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botAtivo: newStatus }),
      });
      setBotAtivo(newStatus);
      toast.success(`Bot ${newStatus ? 'ativado' : 'desativado'}!`);
    } catch (error) {
      toast.error('Erro ao alterar status do bot');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (onDarkModeChange) {
      onDarkModeChange(newMode);
    }
    
    toast.success(`Modo ${newMode ? 'escuro' : 'claro'} ativado!`);
  };

  const toggleNotifications = () => {
    const newStatus = !notificacoesAtivas;
    setNotificacoesAtivas(newStatus);
    localStorage.setItem('notificacoesAtivas', String(newStatus));
    toast.success(`Notificações ${newStatus ? 'ativadas' : 'desativadas'}!`);
  };

  const toggleDia = (dia: string) => {
    const dias = botConfig.horarioFuncionamento.diasFuncionamento;
    const newDias = dias.includes(dia)
      ? dias.filter(d => d !== dia)
      : [...dias, dia];
    
    setBotConfig({
      ...botConfig,
      horarioFuncionamento: {
        ...botConfig.horarioFuncionamento,
        diasFuncionamento: newDias,
      },
    });
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure o sistema e o chatbot</p>
      </div>

      {/* Bot Status Control */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="dark:text-white">Status do Bot</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${botAtivo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <p className="font-semibold text-lg dark:text-white">
                  Bot está {botAtivo ? 'ATIVO' : 'DESATIVADO'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {botAtivo 
                    ? 'O bot está respondendo mensagens automaticamente' 
                    : 'O bot não está respondendo mensagens'}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleBot}
              variant={botAtivo ? 'destructive' : 'default'}
              size="lg"
              className="min-w-[120px]"
            >
              {botAtivo ? 'Desativar' : 'Ativar'} Bot
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Preferences */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="dark:text-white">Aparência e Preferências</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 dark:text-gray-300" /> : <Sun className="w-5 h-5 dark:text-gray-300" />}
              <div>
                <p className="font-medium dark:text-white">Modo Escuro</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alterar tema da interface</p>
              </div>
            </div>
            <Button onClick={toggleDarkMode} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
              {darkMode ? 'Desativar' : 'Ativar'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 dark:text-gray-300" />
              <div>
                <p className="font-medium dark:text-white">Notificações</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertas de novos pedidos e eventos</p>
              </div>
            </div>
            <Button onClick={toggleNotifications} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
              {notificacoesAtivas ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bot Config */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="dark:text-white">Horário de Funcionamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inicio" className="dark:text-gray-300">Horário de Início</Label>
              <Input
                id="inicio"
                type="time"
                value={botConfig.horarioFuncionamento.inicio}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  horarioFuncionamento: {
                    ...botConfig.horarioFuncionamento,
                    inicio: e.target.value,
                  },
                })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="fim" className="dark:text-gray-300">Horário de Término</Label>
              <Input
                id="fim"
                type="time"
                value={botConfig.horarioFuncionamento.fim}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  horarioFuncionamento: {
                    ...botConfig.horarioFuncionamento,
                    fim: e.target.value,
                  },
                })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-300">Dias de Funcionamento</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {diasSemana.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => toggleDia(dia.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    botConfig.horarioFuncionamento.diasFuncionamento.includes(dia.value)
                      ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:border-blue-400'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={saveBotConfig} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações do Bot
          </Button>
        </CardContent>
      </Card>

      {/* Table Config */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="dark:text-white">Configurações de Mesas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="habilitarMesas"
              checked={tableConfig.habilitarMesas}
              onChange={(e) => setTableConfig({
                ...tableConfig,
                habilitarMesas: e.target.checked,
              })}
              className="w-5 h-5 dark:bg-gray-700 dark:border-gray-600"
            />
            <Label htmlFor="habilitarMesas" className="text-base cursor-pointer dark:text-gray-300">
              Habilitar sistema de mesas
            </Label>
          </div>

          {tableConfig.habilitarMesas && (
            <div>
              <Label htmlFor="numeroMesas" className="dark:text-gray-300">Número de Mesas</Label>
              <Input
                id="numeroMesas"
                type="number"
                min="1"
                max="100"
                value={tableConfig.numeroMesas}
                onChange={(e) => setTableConfig({
                  ...tableConfig,
                  numeroMesas: parseInt(e.target.value) || 1,
                })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          <Button onClick={saveTableConfig} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações de Mesas
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Config */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <CardTitle className="dark:text-white">Configurações de Entrega</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taxaEntrega" className="dark:text-gray-300">Taxa de Entrega (R$)</Label>
            <Input
              id="taxaEntrega"
              type="number"
              min="0"
              step="0.50"
              value={deliveryConfig.taxaEntrega}
              onChange={(e) => setDeliveryConfig({
                ...deliveryConfig,
                taxaEntrega: parseFloat(e.target.value) || 0,
              })}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Taxa aplicada automaticamente em pedidos com modo de entrega "delivery"
            </p>
          </div>

          <Button onClick={saveDeliveryConfig} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Taxa de Entrega
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface WhatsAppStatusProps {
  className?: string;
}

export function WhatsAppStatus({ className }: WhatsAppStatusProps) {
  const [status, setStatus] = useState<{
    connected: boolean;
    needsQR: boolean;
    message: string;
  } | null>(null);
  
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
    const [botEnabled, setBotEnabled] = useState<boolean>(true);
    const [botLoading, setBotLoading] = useState(false);

  useEffect(() => {
    // Buscar status inicial
    fetchStatus();
      fetchBotStatus();

    // Verificar status a cada 5 segundos
    const interval = setInterval(fetchStatus, 5000);
      const botInterval = setInterval(fetchBotStatus, 5000);

    // Socket.io para receber QR Code e status em tempo real
    if (typeof (window as any).io === 'function') {
      const socket = new (window as any).io('http://localhost:4000');

      socket.on('whatsapp-qr', (qr: string) => {
        console.log('📱 QR Code recebido via WebSocket');
        setQrCode(qr);
        setStatus({
          connected: false,
          needsQR: true,
          message: 'Escaneie o QR Code com seu WhatsApp'
        });
      });

      socket.on('whatsapp-ready', () => {
        console.log('✅ WhatsApp conectado via WebSocket');
        setStatus({
          connected: true,
          needsQR: false,
          message: 'WhatsApp conectado!'
        });
        setQrCode(null);
        toast.success('WhatsApp conectado com sucesso!');
      });

      return () => {
        socket.disconnect();
        clearInterval(interval);
          clearInterval(botInterval);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/whatsapp/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status do WhatsApp:', error);
      setLoading(false);
    }
  };

    const fetchBotStatus = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/whatsapp/bot');
        if (response.ok) {
          const data = await response.json();
          setBotEnabled(!!data.enabled);
        }
      } catch (error) {
        // Silenciar erro
      }
    };

    const handleToggleBot = async () => {
        setBotLoading(true);
        setBotEnabled(!botEnabled); // feedback instantâneo
        try {
          const response = await fetch('http://localhost:4000/api/whatsapp/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !botEnabled })
          });
          if (response.ok) {
            const data = await response.json();
            setBotEnabled(!!data.enabled); // sincroniza com backend
            toast.success(`Bot ${data.enabled ? 'ativado' : 'desativado'} com sucesso!`);
          } else {
            toast.error('Erro ao alterar estado do bot');
          }
        } catch (error) {
          toast.error('Erro ao comunicar com backend');
        }
        setBotLoading(false);
    };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            WhatsApp Bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          WhatsApp Bot
          {status?.connected && (
            <Badge variant="default" className="ml-auto">
              <span className="mr-1">🟢</span> Conectado
            </Badge>
          )}
          {!status?.connected && (
            <Badge variant="secondary" className="ml-auto">
              <span className="mr-1">🔴</span> Desconectado
            </Badge>
          )}
            <Button
              size="sm"
              variant={botEnabled ? "destructive" : "default"}
              className="ml-auto"
              onClick={handleToggleBot}
              disabled={botLoading}
            >
              {botEnabled ? 'Desativar Bot' : 'Ativar Bot'}
            </Button>
        </CardTitle>
        <CardDescription>
          {status?.message || 'Status desconhecido'}
            <div className="mt-2">
              <Badge variant={botEnabled ? "default" : "secondary"}>
                {botEnabled ? 'Bot Ativo' : 'Bot Desativado'}
              </Badge>
            </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.connected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✅ Bot ativo e pronto para receber mensagens!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os clientes podem fazer pedidos via WhatsApp
              </p>
            </div>
          </div>
        )}

        {status?.needsQR && qrCode && (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                📱 Escaneie o QR Code abaixo com seu WhatsApp
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
              </p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                alt="QR Code WhatsApp"
                className="w-48 h-48"
              />
            </div>

            <Button 
              onClick={fetchStatus} 
              variant="outline" 
              className="w-full"
            >
              🔄 Atualizar Status
            </Button>
          </div>
        )}

        {!status?.connected && !qrCode && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-500/10 border border-gray-500/20 p-4">
              <p className="text-sm font-medium">
                ⏳ Aguardando inicialização do WhatsApp...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O QR Code aparecerá aqui em instantes
              </p>
            </div>

            <Button 
              onClick={fetchStatus} 
              variant="outline" 
              className="w-full"
            >
              🔄 Verificar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

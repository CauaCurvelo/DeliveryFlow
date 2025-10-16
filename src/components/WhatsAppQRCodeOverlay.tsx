import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function WhatsAppQRCodeOverlay({ onConnected }: { onConnected: () => void }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null); // null = verificando, true = conectado, false = desconectado
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let socket: any;
    let statusChecked = false;

    // Primeiro: verificar status atual do WhatsApp
    fetch('http://localhost:4000/api/whatsapp/status')
      .then(res => res.json())
      .then(data => {
        statusChecked = true;
        if (data && data.whatsapp === true) {
          // Já está conectado, não precisa mostrar overlay
          setConnected(true);
          setIsChecking(false);
          onConnected();
        } else {
          // Não está conectado, precisa mostrar overlay
          setConnected(false);
          setIsChecking(false);
        }
      })
      .catch(() => {
        statusChecked = true;
        setConnected(false);
        setIsChecking(false);
      });

    // Socket.io para receber QR Code e status em tempo real
    if (typeof (window as any).io === 'function') {
      socket = new (window as any).io('http://localhost:4000');
      
      socket.on('whatsapp-qr', (qr: string) => {
        setQrCode(qr);
        setConnected(false);
        setIsChecking(false);
      });
      
      socket.on('whatsapp-ready', () => {
        setConnected(true);
        setQrCode(null);
        setIsChecking(false);
        onConnected();
        socket.disconnect();
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [onConnected]);

  // Enquanto está verificando status, não mostra nada (evita flash de overlay)
  if (isChecking || connected === null) return null;
  
  // Se já está conectado, não mostra overlay
  if (connected === true) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-md">
        <h2 className="text-2xl font-bold text-orange-600 mb-4">Conecte o WhatsApp</h2>
        
        {qrCode ? (
          <>
            <p className="text-sm text-gray-700 mb-4 text-center">
              Escaneie o QR Code abaixo com seu WhatsApp
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code WhatsApp"
              className="w-64 h-64 mb-4 border-4 border-orange-500 rounded-lg"
            />
          </>
        ) : (
          <div className="w-64 h-64 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg mb-4 border-4 border-orange-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <span className="text-gray-800 font-bold text-lg">Aguardando QR Code...</span>
          </div>
        )}
        
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
          Recarregar Página
        </Button>
      </div>
    </div>
  );
}

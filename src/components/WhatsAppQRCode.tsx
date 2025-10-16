import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

export default function WhatsAppQRCode() {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    socket.on('whatsapp-qr', (qrCode: string) => {
      setQr(qrCode);
    });
    return () => {
      socket.off('whatsapp-qr');
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: '2rem' }}>
      <h2>Escaneie o QR Code para conectar o WhatsApp</h2>
  {qr ? <QRCode value={qr} size={256} /> : <p>Aguardando QR Code...</p>}
    </div>
  );
}

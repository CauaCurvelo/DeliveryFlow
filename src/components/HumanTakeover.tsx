import { Order } from '../mockData';
import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface HumanTakeoverProps {
  order: Order;
}

export function HumanTakeover({ order }: HumanTakeoverProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; from: 'customer' | 'admin'; timestamp: Date }>>([
    {
      text: order.notes || 'Cliente solicitou atendimento humano',
      from: 'customer',
      timestamp: order.createdAt,
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        text: message,
        from: 'admin',
        timestamp: new Date(),
      },
    ]);

    toast.success('Mensagem enviada ao cliente');
    setMessage('');
  };

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="text-red-500">Atendimento Humano Ativo</h3>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`rounded-lg p-3 ${
              msg.from === 'customer'
                ? 'bg-muted/50 ml-0 mr-8'
                : 'bg-primary/10 ml-8 mr-0'
            }`}
          >
            <p className="text-foreground">{msg.text}</p>
            <p className="text-muted-foreground mt-1">
              {new Intl.DateTimeFormat('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(msg.timestamp)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder="Digite sua mensagem para o cliente..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-1 min-h-[80px]"
        />
        <Button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-muted-foreground mt-2">
        Pressione Enter para enviar ou Shift+Enter para quebrar linha
      </p>
    </div>
  );
}

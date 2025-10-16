import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BotConfigProps {
  onSave?: (config: any) => void;
}

export const BotConfig = forwardRef(function BotConfig({ onSave, hideSaveButton = false }: BotConfigProps & { hideSaveButton?: boolean }, ref) {
  console.log('🔧 BotConfig renderizando...');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState({
    horaAbertura: '18:00',
    horaFechamento: '23:00',
    diasFuncionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações do backend
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/config/bot');
        if (response.ok) {
          const config = await response.json();
          setHorarioFuncionamento(config.horarioFuncionamento);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const diasSemana = [
    { value: 'domingo', label: 'Domingo' },
    { value: 'segunda', label: 'Segunda' },
    { value: 'terca', label: 'Terça' },
    { value: 'quarta', label: 'Quarta' },
    { value: 'quinta', label: 'Quinta' },
    { value: 'sexta', label: 'Sexta' },
    { value: 'sabado', label: 'Sábado' },
  ];

  const handleDiaChange = (dia: string, checked: boolean) => {
    setHorarioFuncionamento(prev => ({
      ...prev,
      diasFuncionamento: checked
        ? [...prev.diasFuncionamento, dia]
        : prev.diasFuncionamento.filter(d => d !== dia)
    }));
  };

  const handleSave = async () => {
  useImperativeHandle(ref, () => ({
    handleSave,
    horarioFuncionamento,
    setHorarioFuncionamento,
  }));
    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/config/bot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ horarioFuncionamento }),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
        if (onSave) {
          onSave(horarioFuncionamento);
        }
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Configure o horário de funcionamento do seu estabelecimento. Quando estiver fechado,
            o bot responderá automaticamente informando o horário de funcionamento.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="abertura">Horário de Abertura</Label>
              <Input
                id="abertura"
                type="time"
                value={horarioFuncionamento.horaAbertura}
                onChange={(e) => setHorarioFuncionamento(prev => ({
                  ...prev,
                  horaAbertura: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="fechamento">Horário de Fechamento</Label>
              <Input
                id="fechamento"
                type="time"
                value={horarioFuncionamento.horaFechamento}
                onChange={(e) => setHorarioFuncionamento(prev => ({
                  ...prev,
                  horaFechamento: e.target.value
                }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Dias de Funcionamento</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diasSemana.map(dia => (
                <div key={dia.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia.value}`}
                    checked={horarioFuncionamento.diasFuncionamento.includes(dia.value)}
                    onCheckedChange={(checked: boolean) => handleDiaChange(dia.value, checked)}
                  />
                  <Label
                    htmlFor={`dia-${dia.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {dia.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            {!hideSaveButton && (
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
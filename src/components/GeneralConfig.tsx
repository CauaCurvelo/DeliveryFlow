import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { DollarSign, Package, Phone, Save, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export const GeneralConfig = forwardRef(function GeneralConfig({ hideSaveButton = false }: { hideSaveButton?: boolean }, ref) {
  const [config, setConfig] = useState({
    taxaEntrega: 5.00,
    pedidoMinimo: 15.00,
    telefone: '',
    whatsapp: '',
    instagram: '',
    notificacoesSonoras: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações do backend
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/config/general');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
  useImperativeHandle(ref, () => ({
    handleSave,
    config,
    setConfig,
  }));
    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/config/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
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
      {/* Configurações de Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Valores e Taxas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxaEntrega">Taxa de Entrega (R$)</Label>
              <Input
                id="taxaEntrega"
                type="number"
                step="0.01"
                min="0"
                value={config.taxaEntrega}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  taxaEntrega: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div>
              <Label htmlFor="pedidoMinimo">Pedido Mínimo (R$)</Label>
              <Input
                id="pedidoMinimo"
                type="number"
                step="0.01"
                min="0"
                value={config.pedidoMinimo}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  pedidoMinimo: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 0000-0000"
                value={config.telefone}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  telefone: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(00) 00000-0000"
                value={config.whatsapp}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  whatsapp: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="text"
                placeholder="@seurestaurante"
                value={config.instagram}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  instagram: e.target.value
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notificacoes">Notificações Sonoras</Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som quando novos pedidos chegarem
              </p>
            </div>
            <Switch
              id="notificacoes"
              checked={config.notificacoesSonoras}
              onCheckedChange={(checked) => setConfig(prev => ({
                ...prev,
                notificacoesSonoras: checked
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div>
        {!hideSaveButton && (
          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        )}
      </div>
    </div>
  );
});

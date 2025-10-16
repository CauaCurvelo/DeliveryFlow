import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Save, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export const TableConfig = forwardRef(function TableConfig({ hideSaveButton = false }: { hideSaveButton?: boolean }, ref) {
  const [totalTables, setTotalTables] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar configuração atual
    fetch('http://localhost:4000/api/config/tables')
      .then(res => res.json())
      .then(data => {
        if (data.totalTables) {
          setTotalTables(data.totalTables);
        }
      })
      .catch(err => console.log('Usando configuração padrão de mesas'));
  }, []);

  const handleSave = async () => {
  useImperativeHandle(ref, () => ({
    handleSave,
    totalTables,
    setTotalTables,
  }));
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/config/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalTables }),
      });

      if (response.ok) {
        toast.success('Configuração de mesas salva!');
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Configuração de Mesas</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Defina quantas mesas estão disponíveis para pedidos no local.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="totalTables">Número Total de Mesas</Label>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTotalTables(Math.max(1, totalTables - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              id="totalTables"
              type="number"
              min="1"
              max="99"
              value={totalTables}
              onChange={(e) => setTotalTables(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
              className="text-center w-24"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTotalTables(Math.min(99, totalTables + 1))}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            As mesas de 1 a {totalTables} estarão disponíveis no app do cliente
          </p>
        </div>

        {!hideSaveButton && (
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        )}
      </div>
    </Card>
  );
});

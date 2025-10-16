import { useRef } from 'react';
import { GeneralConfig } from './GeneralConfig';
import { TableConfig } from './TableConfig';
import { BotConfig } from './BotConfig';
import { Button } from './ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export function ConfigPage() {
  // Refs to access child save methods
  const generalRef = useRef<any>(null);
  const tableRef = useRef<any>(null);
  const botRef = useRef<any>(null);

  // Save all configs at once
  const handleSaveAll = async () => {
    let success = true;
    try {
      if (generalRef.current?.handleSave) await generalRef.current.handleSave();
      if (tableRef.current?.handleSave) await tableRef.current.handleSave();
      if (botRef.current?.handleSave) await botRef.current.handleSave();
      toast.success('Todas configurações salvas com sucesso!');
    } catch (err) {
      success = false;
      toast.error('Erro ao salvar configurações');
    }
    return success;
  };

  return (
    <div className="space-y-6">
      <GeneralConfig ref={generalRef} hideSaveButton />
      <TableConfig ref={tableRef} hideSaveButton />
      <BotConfig ref={botRef} hideSaveButton />
      <div className="pt-4">
        <Button onClick={handleSaveAll} className="w-full md:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}

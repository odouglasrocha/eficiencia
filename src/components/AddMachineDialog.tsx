import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { CreateMachineData } from '@/hooks/useMachines';

interface AddMachineDialogProps {
  onAdd: (data: CreateMachineData) => Promise<any>;
}

export function AddMachineDialog({ onAdd }: AddMachineDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMachineData>({
    name: '',
    code: '',
    status: 'inativa',
    permissions: [],
    access_level: 'operador',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onAdd(formData);
      setOpen(false);
      setFormData({
        name: '',
        code: '',
        status: 'inativa',
        permissions: [],
        access_level: 'operador',
      });
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMachineData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const availablePermissions = [
    'visualizar_oee',
    'editar_producao',
    'visualizar_relatorios',
    'gerenciar_alertas',
    'configurar_maquina'
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Máquina
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Máquina</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova máquina no sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Máquina</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Extrusora Alpha"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              placeholder="Ex: EXT-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inativa">Inativa</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="parada">Parada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_level">Nível de Acesso</Label>
            <Select value={formData.access_level} onValueChange={(value) => handleInputChange('access_level', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permissões</Label>
            <div className="grid grid-cols-1 gap-3">
              {availablePermissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={formData.permissions.includes(permission)}
                    onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                  />
                  <Label 
                    htmlFor={permission} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {getPermissionLabel(permission)}
                  </Label>
                </div>
              ))}
            </div>
          </div>


          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Máquina'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getPermissionLabel(permission: string): string {
  const labels: { [key: string]: string } = {
    visualizar_oee: 'Visualizar OEE',
    editar_producao: 'Editar Produção',
    visualizar_relatorios: 'Visualizar Relatórios',
    gerenciar_alertas: 'Gerenciar Alertas',
    configurar_maquina: 'Configurar Máquina'
  };
  return labels[permission] || permission;
}
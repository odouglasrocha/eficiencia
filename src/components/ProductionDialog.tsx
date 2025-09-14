import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Package, Target, AlertCircle, Factory, Settings, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMachines } from "@/hooks/useMachines";
import { useDowntimeReasons } from "@/hooks/useDowntimeReasons";
import { useProductionRecords } from "@/hooks/useProductionRecords";
import { materialsData } from "@/data/materialsData";
import { getShiftFromDateTime, formatShiftDisplay, getShiftInfo, type ShiftType } from "@/lib/shifts";
import { cn } from "@/lib/utils";

interface DowntimeEvent {
  id: string;
  reason: string;
  duration: number;
  description: string;
}

interface ProductionData {
  machineId: string;
  materialCode: string; // Relacionado com materialsData.Codigo
  startTime: string;
  endTime: string;
  plannedTime: number; // Calculado automaticamente
  goodProduction: number;
  filmWaste: number; // Formato 0000
  organicWaste: string; // Formato 1,000 (string para permitir vírgula)
  downtimeEvents: DowntimeEvent[];
  shift?: ShiftType; // Turno calculado automaticamente
}

interface ProductionDialogProps {
  machineId?: string;
  onAdd?: (data: ProductionData) => Promise<any>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductionDialog({ machineId, onAdd, open, onOpenChange }: ProductionDialogProps) {
  const { machines } = useMachines();
  const { reasons } = useDowntimeReasons();
  const { createOrUpdateProductionRecord, loading: isLoading } = useProductionRecords();

  const [formData, setFormData] = useState<ProductionData>({
    machineId: machineId || "",
    materialCode: "",
    startTime: "",
    endTime: "",
    plannedTime: 0, // Será calculado automaticamente
    goodProduction: 0,
    filmWaste: 0,
    organicWaste: "0,000",
    downtimeEvents: [],
    shift: undefined // Será calculado automaticamente
  });

  // Atualizar machineId quando prop mudar
  useEffect(() => {
    if (machineId) {
      setFormData(prev => ({
        ...prev,
        machineId
      }));
    }
  }, [machineId]);

  // Calcular tempo total de paradas
  const totalDowntimeMinutes = formData.downtimeEvents.reduce((total, event) => total + event.duration, 0);

  // Calcular meta baseado no produto selecionado
  const calculateMeta = () => {
    if (!formData.materialCode || !formData.plannedTime) {
      return 0;
    }
    
    const selectedMaterial = materialsData.find(material => material.Codigo === formData.materialCode);
    if (!selectedMaterial) {
      return 0;
    }
    
    // Meta = PPm * Tempo Planejado (min) * 85%
    return Math.round(selectedMaterial.PPm * formData.plannedTime * 0.85);
  };

  const metaValue = calculateMeta();

  // Função para adicionar nova parada
  const addDowntimeEvent = () => {
    const newEvent: DowntimeEvent = {
      id: Date.now().toString(),
      reason: "",
      duration: 0,
      description: ""
    };
    setFormData(prev => ({
      ...prev,
      downtimeEvents: [...prev.downtimeEvents, newEvent]
    }));
  };

  // Função para remover parada
  const removeDowntimeEvent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      downtimeEvents: prev.downtimeEvents.filter(event => event.id !== id)
    }));
  };

  // Função para atualizar parada
  const updateDowntimeEvent = (id: string, field: keyof DowntimeEvent, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      downtimeEvents: prev.downtimeEvents.map(event => 
        event.id === id ? { ...event, [field]: value } : event
      )
    }));
  };
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      // Tratar casos onde a data final é no dia seguinte
      let diffInMs = end.getTime() - start.getTime();
      if (diffInMs < 0) {
        // Se negativo, adicionar 24 horas (caso que cruza meia-noite)
        diffInMs += 24 * 60 * 60 * 1000;
      }
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      setFormData(prev => ({
        ...prev,
        plannedTime: diffInMinutes
      }));
    }
  }, [formData.startTime, formData.endTime]);

  // Calcular turno baseado na hora de início
  useEffect(() => {
    if (formData.startTime) {
      const shift = getShiftFromDateTime(formData.startTime);
      setFormData(prev => ({
        ...prev,
        shift
      }));
    }
  }, [formData.startTime]);

  const handleInputChange = (field: keyof ProductionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para formatar valor orgânico (formato 1,000)
  const formatOrganicWaste = (value: string) => {
    // Remove tudo que não é número ou vírgula
    const cleaned = value.replace(/[^\d,]/g, '');
    // Garante apenas uma vírgula
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Função para formatar filme (formato 0000)
  const formatFilmWaste = (value: string) => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    return cleaned.padStart(4, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.materialCode || !formData.startTime || !formData.endTime || !formData.machineId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Máquina, Código, Início e Fim)",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      // Verificar se é caso de cruzar meia-noite
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      // Se as datas são iguais mas o horário final é menor, assumir dia seguinte
      if (start.toDateString() === end.toDateString()) {
        toast({
          title: "Erro",
          description: "Hora de fim deve ser posterior à de início",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      // Usar a nova lógica de upsert que automaticamente cria registros no oee_history
      await createOrUpdateProductionRecord(formData);
      
      if (onAdd) {
        await onAdd(formData);
      }
      
      onOpenChange?.(false);
      setFormData({
        machineId: machineId || "",
        materialCode: "",
        startTime: "",
        endTime: "",
        plannedTime: 0,
        goodProduction: 0,
        filmWaste: 0,
        organicWaste: "0,000",
        downtimeEvents: [],
        shift: undefined
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registro de Produção
          </DialogTitle>
          <DialogDescription>
            Registre os dados de produção da máquina selecionada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seleção do Código/Material */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Produto</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material" className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Código *
              </Label>
              <Select
                value={formData.materialCode}
                onValueChange={(value) => handleInputChange('materialCode', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o código do material" />
                </SelectTrigger>
                <SelectContent>
                  {materialsData.map((material) => (
                    <SelectItem key={material.Codigo} value={material.Codigo}>
                      <div className="flex flex-col">
                        <span className="font-medium">{material.Codigo}</span>
                        <span className="text-sm text-muted-foreground">{material.Material}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período de Produção */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Período de Produção</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Início *
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fim *
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedTime" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tempo Planejado (min)
                </Label>
                <Input
                  id="plannedTime"
                  type="number"
                  value={formData.plannedTime}
                  readOnly
                  className="bg-muted h-11"
                  placeholder="Calculado automaticamente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Turno
                </Label>
                {formData.shift ? (
                  <div className={cn("h-11 px-3 py-2 border rounded-md flex items-center", getShiftInfo(formData.shift).color)}>
                    <span className="font-medium">
                      {formatShiftDisplay(formData.shift)}
                    </span>
                  </div>
                ) : (
                  <div className="h-11 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="text-muted-foreground">Selecione hora de início</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produção e Refugos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Produção e Refugos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goodProduction" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produção Boa (UND)
                </Label>
                <Input
                  id="goodProduction"
                  type="number"
                  min="0"
                  value={formData.goodProduction}
                  onChange={(e) => handleInputChange('goodProduction', parseInt(e.target.value) || 0)}
                  placeholder="Digite a quantidade"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Meta
                </Label>
                <Input
                  id="meta"
                  type="number"
                  value={metaValue}
                  readOnly
                  className="bg-muted h-11"
                  placeholder="Calculado automaticamente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filmWaste" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Perda de Filme (UND)
                </Label>
                <Input
                  id="filmWaste"
                  type="text"
                  value={formData.filmWaste.toString().padStart(4, '0')}
                  onChange={(e) => {
                    const formatted = formatFilmWaste(e.target.value);
                    handleInputChange('filmWaste', parseInt(formatted) || 0);
                  }}
                  placeholder="0000"
                  maxLength={4}
                  className="h-11 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organicWaste" className="flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Refugo Orgânico (kg)
                </Label>
                <Input
                  id="organicWaste"
                  type="text"
                  value={formData.organicWaste}
                  onChange={(e) => {
                    const formatted = formatOrganicWaste(e.target.value);
                    handleInputChange('organicWaste', formatted);
                  }}
                  placeholder="1,000"
                  className="h-11 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Paradas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Registro de Paradas</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                title="Configurar motivos de parada"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Total de Paradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Label className="text-sm font-medium">Total de Paradas (minutos)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={totalDowntimeMinutes}
                      readOnly
                      className="bg-muted h-11 pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                </div>
                <div className="ml-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDowntimeEvent}
                    className="flex items-center gap-2 h-11"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Adicionar Parada
                  </Button>
                </div>
              </div>

              {/* Eventos de Parada */}
              {formData.downtimeEvents.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Eventos de Parada:</Label>
                  <div className="space-y-3">
                    {formData.downtimeEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-4 space-y-1">
                            <Label className="text-xs text-muted-foreground">Motivo</Label>
                            <Select
                              value={event.reason}
                              onValueChange={(value) => updateDowntimeEvent(event.id, 'reason', value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Motivo" />
                              </SelectTrigger>
                              <SelectContent>
                                {reasons.map((reason) => (
                                  <SelectItem key={reason.id} value={reason.name}>
                                    {reason.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={event.duration}
                              onChange={(e) => updateDowntimeEvent(event.id, 'duration', parseInt(e.target.value) || 0)}
                              className="h-10"
                              placeholder="0"
                            />
                          </div>
                          <div className="md:col-span-4 space-y-1">
                            <Label className="text-xs text-muted-foreground">Descrição</Label>
                            <Input
                              type="text"
                              value={event.description}
                              onChange={(e) => updateDowntimeEvent(event.id, 'description', e.target.value)}
                              className="h-10"
                              placeholder="Detalhes da parada"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDowntimeEvent(event.id)}
                              className="h-10 w-10 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
              className="w-full sm:w-auto h-11"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-11">
              {isLoading ? "Salvando..." : "Salvar Produção"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
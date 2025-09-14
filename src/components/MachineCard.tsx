import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Play, Pause, AlertCircle, CheckCircle, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getShiftFromDateTime, formatShiftDisplay, getShiftInfo } from "@/lib/shifts";

interface MachineCardProps {
  id: string;
  name: string;
  code: string;
  status: "ativa" | "manutencao" | "parada" | "inativa";
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  currentProduction: number;
  targetProduction: number;
  onViewDetails?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onAddProduction?: (id: string) => void;
  onDeleteMachine?: (id: string) => void;
  className?: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "ativa":
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        text: "Ativa"
      };
    case "manutencao":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Settings,
        text: "Manutenção"
      };
    case "parada":
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: Pause,
        text: "Parada"
      };
    case "inativa":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle,
        text: "Inativa"
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle,
        text: "Desconhecido"
      };
  }
};

const getOeeColor = (oee: number) => {
  if (oee >= 75) return "text-green-600";
  if (oee >= 65) return "text-orange-600";
  if (oee >= 50) return "text-orange-600";
  return "text-red-600";
};

export function MachineCard({
  id,
  name,
  code,
  status,
  oee,
  availability,
  performance,
  quality,
  currentProduction,
  targetProduction,
  onViewDetails,
  onToggleStatus,
  onAddProduction,
  onDeleteMachine,
  className
}: MachineCardProps) {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const isLowOee = oee < 65;
  const productionPercentage = targetProduction > 0 ? Math.min((currentProduction / targetProduction) * 100, 100) : 0;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      isLowOee && status === "ativa" && "ring-2 ring-red-300 border-red-200",
      !isLowOee && status === "ativa" && "border-green-200",
      status === "parada" && "border-red-200",
      status === "manutencao" && "border-yellow-200",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Código: {code}</p>
              {/* Turno baseado no último registro de produção */}
              {(() => {
                // Mapear turnos A, B, C para Manhã, Tarde, Noite
                 // Também aceitar valores diretos como "Tarde", "Manhã", "Noite"
                 const shiftMapping = {
                   'A': 'Manhã' as const,
                   'B': 'Tarde' as const, 
                   'C': 'Noite' as const,
                   'Manhã': 'Manhã' as const,
                   'Tarde': 'Tarde' as const,
                   'Noite': 'Noite' as const
                 };
                
                // Relacionamento: test.machines.code relaciona com test.productionrecords.machine_id
                 // Buscar dados da máquina primeiro
                 const machines = JSON.parse(localStorage.getItem('machines') || '[]');
                 const machine = machines.find((m: any) => m._id === id || m.code === id);
                 const machineCode = machine?.code; // EA01, EA02, etc.
                 
                 // Buscar registros de produção usando machine_id = machines.code
                 const productionRecords = JSON.parse(localStorage.getItem('productionRecords') || '[]');
                 const machineRecords = productionRecords.filter((r: any) => r.machine_id === machineCode);
                 const lastRecord = machineRecords.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];
                 
                 // Usar turno do último registro test.productionrecords.shift
                 let recordShift = lastRecord?.shift; // Campo shift da tabela test.productionrecords
                 
                 // Se não há registro, usar propriedade shift da máquina criada
                 if (!recordShift) {
                   recordShift = machine?.shift || 'Manhã'; // Usar propriedade shift da máquina
                 }
                 
                 const currentShift = recordShift && shiftMapping[recordShift as keyof typeof shiftMapping] 
                   ? shiftMapping[recordShift as keyof typeof shiftMapping]
                   : getShiftFromDateTime(new Date());
                  
                const shiftInfo = getShiftInfo(currentShift);
                return (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", shiftInfo.color)}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatShiftDisplay(currentShift)}
                  </Badge>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {onAddProduction && (
                <Button
                  size="icon"
                  variant="ghost" 
                  className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddProduction(id);
                  }}
                  title="Inserir Produção"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {onDeleteMachine && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMachine(id);
                  }}
                  title="Excluir Máquina e Todos os Registros"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-xs border", statusConfig.color)}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.text}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OEE Principal */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">OEE Atual</span>
          <div className="flex items-center space-x-2">
            <span className={cn("text-2xl font-bold", getOeeColor(oee))}>
              {oee.toFixed(1)}%
            </span>
            {isLowOee && status === "ativa" && (
              <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            )}
          </div>
        </div>

        {/* Métricas OEE */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold text-foreground">{availability.toFixed(1)}%</div>
            <div className="text-muted-foreground">Disponibilidade</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold text-foreground">{performance.toFixed(1)}%</div>
            <div className="text-muted-foreground">Performance</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold text-foreground">{quality.toFixed(1)}%</div>
            <div className="text-muted-foreground">Qualidade</div>
          </div>
        </div>

        {/* Produção */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Produção Boa (UND)</span>
            <span className="font-medium">
              {currentProduction.toLocaleString()} UND
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta</span>
            <span className="font-medium">
              {targetProduction.toLocaleString()} UND
            </span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                productionPercentage >= 90 ? "bg-green-500" : 
                productionPercentage >= 75 ? "bg-green-400" : 
                productionPercentage >= 50 ? "bg-orange-400" : "bg-red-500"
              )}
              style={{ width: `${productionPercentage}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {targetProduction > 0 ? `${productionPercentage.toFixed(1)}% da meta` : 'Meta não definida'}
          </div>
        </div>

        {/* Ações */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={() => onViewDetails?.(id)}
          >
            Ver Detalhes
          </Button>
          <Button 
            variant={status === "ativa" ? "outline" : "default"}
            size="sm"
            onClick={() => onToggleStatus?.(id)}
            className={cn(
              status === "ativa" 
                ? "text-red-600 hover:bg-red-50" 
                : "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            {status === "ativa" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>

      {/* Indicador de alerta para OEE baixo */}
      {isLowOee && status === "ativa" && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
      )}
    </Card>
  );
}
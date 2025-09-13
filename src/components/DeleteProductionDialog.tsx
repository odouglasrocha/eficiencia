import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProductionRecord {
  id: string;
  machineName: string;
  startTime: string;
  endTime: string;
  goodProduction: number;
}

interface DeleteProductionDialogProps {
  onDelete?: (recordId: string) => Promise<any>;
}

export function DeleteProductionDialog({ onDelete }: DeleteProductionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState("");

  // Mock data - substituir por dados reais do Supabase futuramente
  const productionRecords: ProductionRecord[] = [
    {
      id: "1",
      machineName: "Máquina 01 - Extrusora A",
      startTime: "2024-01-15 06:00",
      endTime: "2024-01-15 14:00", 
      goodProduction: 1250
    },
    {
      id: "2", 
      machineName: "Máquina 02 - Extrusora B",
      startTime: "2024-01-15 14:00",
      endTime: "2024-01-15 22:00",
      goodProduction: 980
    },
    {
      id: "3",
      machineName: "Máquina 03 - Injetora C", 
      startTime: "2024-01-15 22:00",
      endTime: "2024-01-16 06:00",
      goodProduction: 2100
    }
  ];

  const handleDelete = async () => {
    if (!selectedRecord) {
      toast({
        title: "Erro",
        description: "Selecione um registro de produção para excluir",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (onDelete) {
        await onDelete(selectedRecord);
      }
      
      toast({
        title: "Sucesso",
        description: "Registro de produção excluído com sucesso",
      });
      
      setIsOpen(false);
      setSelectedRecord("");
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Falha ao excluir registro de produção",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRecordData = productionRecords.find(r => r.id === selectedRecord);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Produção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Registro de Produção
          </DialogTitle>
          <DialogDescription>
            Selecione o registro de produção que deseja excluir. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção do Registro */}
          <div className="space-y-2">
            <Label htmlFor="record">Registro de Produção</Label>
            <Select
              value={selectedRecord}
              onValueChange={setSelectedRecord}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um registro para excluir" />
              </SelectTrigger>
              <SelectContent>
                {productionRecords.map((record) => (
                  <SelectItem key={record.id} value={record.id}>
                    {record.machineName} - {record.startTime} às {record.endTime.split(' ')[1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detalhes do Registro Selecionado */}
          {selectedRecordData && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Detalhes do Registro:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Máquina:</span>
                  <p className="font-medium">{selectedRecordData.machineName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Produção:</span>
                  <p className="font-medium">{selectedRecordData.goodProduction} UND</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Início:</span>
                  <p className="font-medium">{selectedRecordData.startTime}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fim:</span>
                  <p className="font-medium">{selectedRecordData.endTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso de Exclusão */}
          {selectedRecord && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Atenção</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ao excluir este registro, todas as informações de produção, refugos e paradas 
                serão permanentemente removidas do sistema.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading || !selectedRecord}
            >
              {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
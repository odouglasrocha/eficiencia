import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, BarChart3, Calendar, Clock } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ReportConfig {
  type: 'oee' | 'production' | 'downtime' | 'quality' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  machines: string[];
  dateRange: DateRange | undefined;
  includeCharts: boolean;
  includeAnalysis: boolean;
  includeRecommendations: boolean;
}

export function ReportsGenerator() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    type: 'oee',
    format: 'pdf',
    machines: [],
    dateRange: {
      from: addDays(new Date(), -7),
      to: new Date(),
    },
    includeCharts: true,
    includeAnalysis: true,
    includeRecommendations: false,
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'oee', label: 'Relatório OEE', icon: BarChart3 },
    { value: 'production', label: 'Relatório de Produção', icon: FileText },
    { value: 'downtime', label: 'Análise de Paradas', icon: Clock },
    { value: 'quality', label: 'Relatório de Qualidade', icon: BarChart3 },
    { value: 'custom', label: 'Relatório Personalizado', icon: FileText },
  ];

  const machines = [
    { id: 'M001', code: 'EXT-001', name: 'Extrusora Alpha' },
    { id: 'M002', code: 'IMP-002', name: 'Impressora Beta' },
    { id: 'M003', code: 'SOL-003', name: 'Soldadora Gamma' },
    { id: 'M004', code: 'COR-004', name: 'Cortadora Delta' },
    { id: 'M005', code: 'EMB-005', name: 'Embaladera Epsilon' },
  ];

  const handleMachineToggle = (machineId: string) => {
    setConfig(prev => ({
      ...prev,
      machines: prev.machines.includes(machineId)
        ? prev.machines.filter(id => id !== machineId)
        : [...prev.machines, machineId]
    }));
  };

  const selectAllMachines = () => {
    setConfig(prev => ({
      ...prev,
      machines: machines.map(m => m.id)
    }));
  };

  const clearAllMachines = () => {
    setConfig(prev => ({
      ...prev,
      machines: []
    }));
  };

  const generateReport = async () => {
    if (config.machines.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma máquina para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    if (!config.dateRange?.from || !config.dateRange?.to) {
      toast({
        title: "Atenção",
        description: "Selecione um período para o relatório.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportName = `${reportTypes.find(r => r.value === config.type)?.label}_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.${config.format}`;
      
      toast({
        title: "Relatório Gerado",
        description: `${reportName} foi gerado com sucesso!`,
      });

      // Here you would typically trigger a download
      // For demo purposes, we'll just show a success message
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(r => r.value === config.type);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configuração do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Tipo de Relatório</label>
                <Select value={config.type} onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Formato de Saída</label>
                <Select value={config.format} onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Período</label>
                <DatePickerWithRange
                  date={config.dateRange}
                  onDateChange={(date) => setConfig(prev => ({ ...prev, dateRange: date }))}
                />
              </div>

              {/* Machines Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Máquinas</label>
                  <div>
                    <Button variant="ghost" size="sm" onClick={selectAllMachines}>
                      Todas
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllMachines}>
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {machines.map((machine) => (
                    <div key={machine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={machine.id}
                        checked={config.machines.includes(machine.id)}
                        onCheckedChange={() => handleMachineToggle(machine.id)}
                      />
                      <label
                        htmlFor={machine.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {machine.code} - {machine.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Opções Adicionais</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={config.includeCharts}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: checked as boolean }))}
                    />
                    <label htmlFor="charts" className="text-sm">
                      Incluir gráficos e visualizações
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="analysis"
                      checked={config.includeAnalysis}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeAnalysis: checked as boolean }))}
                    />
                    <label htmlFor="analysis" className="text-sm">
                      Incluir análise detalhada
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recommendations"
                      checked={config.includeRecommendations}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeRecommendations: checked as boolean }))}
                    />
                    <label htmlFor="recommendations" className="text-sm">
                      Incluir recomendações de melhoria
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedReportType && (
                <div className="flex items-center gap-2">
                  <selectedReportType.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedReportType.label}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {config.dateRange?.from && config.dateRange?.to
                      ? `${format(config.dateRange.from, 'dd/MM/yyyy')} - ${format(config.dateRange.to, 'dd/MM/yyyy')}`
                      : 'Período não selecionado'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Formato: {config.format.toUpperCase()}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">Máquinas Selecionadas:</span>
                {config.machines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma máquina selecionada</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {config.machines.map((machineId) => {
                      const machine = machines.find(m => m.id === machineId);
                      return machine ? (
                        <Badge key={machineId} variant="secondary" className="text-xs">
                          {machine.code}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">Incluir:</span>
                <div className="space-y-1">
                  {config.includeCharts && (
                    <div className="text-xs text-muted-foreground">• Gráficos e visualizações</div>
                  )}
                  {config.includeAnalysis && (
                    <div className="text-xs text-muted-foreground">• Análise detalhada</div>
                  )}
                  {config.includeRecommendations && (
                    <div className="text-xs text-muted-foreground">• Recomendações</div>
                  )}
                </div>
              </div>

              <Separator />

              <Button 
                onClick={generateReport} 
                disabled={generating || config.machines.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                OEE Semanal
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Paradas do Dia
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Produção Mensal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OeeChart } from '@/components/OeeChart';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useMachines } from '@/hooks/useMachines';
import { TrendingUp, AlertTriangle, Clock, Zap, Target, BarChart3 } from 'lucide-react';

export function AdvancedAnalytics() {
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const { machines, loading: machinesLoading } = useMachines();
  const { data, loading, error } = useHistoricalData(selectedMachine === 'all' ? undefined : selectedMachine);

  if (machinesLoading || loading) {

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Erro ao carregar análises históricas dos últimos 30 dias</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header com indicação do mês atual */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análises Avançadas</h2>
          <p className="text-sm text-muted-foreground">
            Produtividade mensal - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Máquinas</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.code} - {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">OEE Médio (Mês Atual)</p>
                <p className="text-2xl font-bold">{data.avgOee.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={data.avgOee} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Tendência: {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Parado Total</p>
                <p className="text-2xl font-bold">{data.totalDowntime.toFixed(0)}h</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MTBF: {data.mtbf.toFixed(1)}h | Eventos: {data.downtimeEvents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produção Total</p>
                <p className="text-2xl font-bold">{data.totalProduction.toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta Atingida: {((data.totalProduction / data.totalTarget) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Críticos</p>
                <p className="text-2xl font-bold">{data.criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="productivity">Produtividade Mensal</TabsTrigger>
          <TabsTrigger value="downtime">Análise de Paradas</TabsTrigger>
          <TabsTrigger value="trends">Tendências do Mês</TabsTrigger>
          <TabsTrigger value="insights">Insights e Riscos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Componentes OEE - Média do Mês Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Disponibilidade</span>
                  <span className="text-sm font-bold">{data.avgAvailability.toFixed(1)}%</span>
                </div>
                <Progress value={data.avgAvailability} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Performance</span>
                  <span className="text-sm font-bold">{data.avgPerformance.toFixed(1)}%</span>
                </div>
                <Progress value={data.avgPerformance} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Qualidade</span>
                  <span className="text-sm font-bold">{data.avgQuality.toFixed(1)}%</span>
                </div>
                <Progress value={data.avgQuality} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade Mensal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Mês Atual</p>
                    <p className="text-2xl font-bold">{data.monthlyProductivity.currentMonth.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Mês Anterior</p>
                    <p className="text-2xl font-bold">{data.monthlyProductivity.previousMonth.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={data.monthlyProductivity.trend === 'improvement' ? 'default' : 
                                 data.monthlyProductivity.trend === 'decline' ? 'destructive' : 'secondary'}>
                    {data.monthlyProductivity.trend === 'improvement' ? 'Melhoria' : 
                     data.monthlyProductivity.trend === 'decline' ? 'Queda' : 'Estável'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {data.monthlyProductivity.percentageChange > 0 ? '+' : ''}
                    {data.monthlyProductivity.percentageChange.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Variações de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Produção Média Diária</p>
                  <p className="text-xl font-bold">{data.performanceVariations.averageDailyProduction.toFixed(0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Variação Máxima: {data.performanceVariations.maxVariation.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {data.performanceVariations.hasSignificantVariations 
                      ? `${data.performanceVariations.variationDays} dias com variações significativas`
                      : 'Performance estável ao longo do mês'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="downtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Paradas - Mês Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {data.downtimeByCategory.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm font-bold">
                      {item.totalHours.toFixed(1)}h ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência OEE - Mês Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <OeeChart
                type="line"
                title="Evolução OEE (Mês Corrente)"
                data={data.oeeHistory}
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Risco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={data.riskAnalysis.riskLevel === 'low' ? 'default' :
                                 data.riskAnalysis.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                    Risco {data.riskAnalysis.riskLevel === 'low' ? 'Baixo' :
                           data.riskAnalysis.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                  </Badge>
                </div>
                
                {data.riskAnalysis.factors.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Fatores de Risco:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {data.riskAnalysis.factors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.riskAnalysis.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recomendações:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {data.riskAnalysis.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades de Melhoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.improvementOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{opportunity.area}</p>
                      <p className="text-xs text-muted-foreground">{opportunity.suggestion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Potencial: +{opportunity.potential.toFixed(1)}% OEE
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resumo da Análise Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Produtividade do Mês</h5>
                    <p className="text-xs text-muted-foreground">
                      {data.monthlyProductivity.currentMonth.toLocaleString()} unidades produzidas
                      {data.monthlyProductivity.trend === 'improvement' && ' (↗️ Melhoria)'}
                      {data.monthlyProductivity.trend === 'decline' && ' (↘️ Queda)'}
                      {data.monthlyProductivity.trend === 'stable' && ' (➡️ Estável)'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Variações de Performance</h5>
                    <p className="text-xs text-muted-foreground">
                      {data.performanceVariations.hasSignificantVariations 
                        ? `Variações significativas detectadas (${data.performanceVariations.maxVariation.toFixed(1)}% máx.)`
                        : 'Performance estável durante o mês'
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Tendência de Performance</h5>
                    <p className="text-xs text-muted-foreground">
                      {data.riskAnalysis.riskLevel === 'low' && 'Tendência positiva, baixo risco'}
                      {data.riskAnalysis.riskLevel === 'medium' && 'Atenção necessária, risco moderado'}
                      {data.riskAnalysis.riskLevel === 'high' && 'Intervenção urgente necessária'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
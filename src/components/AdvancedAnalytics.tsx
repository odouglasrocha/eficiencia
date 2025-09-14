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
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Target, 
  BarChart3, 
  Activity, 
  Settings, 
  PieChart, 
  LineChart, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Gauge,
  Factory,
  Calendar,
  TrendingDown,
  Minus
} from 'lucide-react';

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
    <div className="space-y-8">
      {/* Header aprimorado com melhor hierarquia visual */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Análises Avançadas
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </Badge>
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                Dashboard de Performance e Insights - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedMachine} onValueChange={setSelectedMachine}>
              <SelectTrigger className="w-[220px] bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-sm">
                <Factory className="h-4 w-4 mr-2 text-blue-500" />
                <SelectValue placeholder="Selecionar máquina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    Todas as Máquinas
                  </div>
                </SelectItem>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-gray-500" />
                      {machine.code} - {machine.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards aprimorados com cores intuitivas e melhor design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card OEE - Verde para bom desempenho */}
        <Card className={`transition-all duration-200 hover:shadow-lg border-l-4 ${
          data.avgOee >= 75 ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10' :
          data.avgOee >= 60 ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10' :
          'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  OEE Médio (Mês Atual)
                </p>
                <p className={`text-3xl font-bold mt-1 ${
                  data.avgOee >= 75 ? 'text-green-600 dark:text-green-400' :
                  data.avgOee >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {data.avgOee.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                data.avgOee >= 75 ? 'bg-green-100 dark:bg-green-900' :
                data.avgOee >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' :
                'bg-red-100 dark:bg-red-900'
              }`}>
                {data.trend > 0 ? (
                  <TrendingUp className={`h-6 w-6 ${
                    data.avgOee >= 75 ? 'text-green-600 dark:text-green-400' :
                    data.avgOee >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`} />
                ) : data.trend < 0 ? (
                  <TrendingDown className={`h-6 w-6 ${
                    data.avgOee >= 75 ? 'text-green-600 dark:text-green-400' :
                    data.avgOee >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`} />
                ) : (
                  <Minus className={`h-6 w-6 ${
                    data.avgOee >= 75 ? 'text-green-600 dark:text-green-400' :
                    data.avgOee >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`} />
                )}
              </div>
            </div>
            <Progress 
              value={data.avgOee} 
              className={`mt-3 h-2 ${
                data.avgOee >= 75 ? '[&>div]:bg-green-500' :
                data.avgOee >= 60 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-red-500'
              }`} 
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tendência: {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
              </p>
              <Badge variant={data.avgOee >= 75 ? 'default' : data.avgOee >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                {data.avgOee >= 75 ? 'Excelente' : data.avgOee >= 60 ? 'Bom' : 'Crítico'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card Tempo Parado - Vermelho para alertas */}
        <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Parado Total
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {data.totalDowntime.toFixed(0)}h
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">MTBF:</span>
                <span className="font-medium text-red-600">{data.mtbf.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Eventos:</span>
                <span className="font-medium text-red-600">{data.downtimeEvents}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Produção - Azul para produtividade */}
        <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Produção Total
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {data.totalProduction.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Meta Atingida</span>
                <span className="text-xs font-medium text-blue-600">
                  {((data.totalProduction / data.totalTarget) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(data.totalProduction / data.totalTarget) * 100} 
                className="h-2 [&>div]:bg-blue-500" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Card Alertas - Laranja/Vermelho baseado na quantidade */}
        <Card className={`transition-all duration-200 hover:shadow-lg border-l-4 ${
          data.criticalAlerts === 0 ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10' :
          data.criticalAlerts <= 3 ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10' :
          'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Alertas Críticos
                </p>
                <p className={`text-3xl font-bold mt-1 ${
                  data.criticalAlerts === 0 ? 'text-green-600 dark:text-green-400' :
                  data.criticalAlerts <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {data.criticalAlerts}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                data.criticalAlerts === 0 ? 'bg-green-100 dark:bg-green-900' :
                data.criticalAlerts <= 3 ? 'bg-yellow-100 dark:bg-yellow-900' :
                'bg-red-100 dark:bg-red-900'
              }`}>
                {data.criticalAlerts === 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className={`h-6 w-6 ${
                    data.criticalAlerts <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`} />
                )}
              </div>
            </div>
            <div className="mt-3">
              <Badge 
                variant={data.criticalAlerts === 0 ? 'default' : data.criticalAlerts <= 3 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {data.criticalAlerts === 0 ? 'Sistema Normal' :
                 data.criticalAlerts <= 3 ? 'Atenção Necessária' :
                 'Intervenção Urgente'}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Mês atual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs aprimoradas com ícones e melhor design */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border">
          <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
            >
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="productivity" 
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Produtividade</span>
            </TabsTrigger>
            <TabsTrigger 
              value="downtime" 
              className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900 dark:data-[state=active]:text-red-300"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Paradas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-300"
            >
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Tendências</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 dark:data-[state=active]:bg-orange-900 dark:data-[state=active]:text-orange-300"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl text-blue-900 dark:text-blue-100">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Componentes OEE - Análise Detalhada
                <Badge variant="outline" className="ml-auto text-blue-600 border-blue-300">
                  Mês Atual
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Disponibilidade */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Disponibilidade</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data.avgAvailability.toFixed(1)}%
                    </span>
                    <Badge 
                      variant={data.avgAvailability >= 85 ? 'default' : data.avgAvailability >= 70 ? 'secondary' : 'destructive'} 
                      className="ml-2 text-xs"
                    >
                      {data.avgAvailability >= 85 ? 'Excelente' : data.avgAvailability >= 70 ? 'Bom' : 'Crítico'}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={data.avgAvailability} 
                  className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-green-600" 
                />
                <p className="text-xs text-gray-500 mt-2">Tempo de operação vs tempo planejado</p>
              </div>

              {/* Performance */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Performance</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {data.avgPerformance.toFixed(1)}%
                    </span>
                    <Badge 
                      variant={data.avgPerformance >= 85 ? 'default' : data.avgPerformance >= 70 ? 'secondary' : 'destructive'} 
                      className="ml-2 text-xs"
                    >
                      {data.avgPerformance >= 85 ? 'Excelente' : data.avgPerformance >= 70 ? 'Bom' : 'Crítico'}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={data.avgPerformance} 
                  className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600" 
                />
                <p className="text-xs text-gray-500 mt-2">Velocidade real vs velocidade ideal</p>
              </div>

              {/* Qualidade */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Qualidade</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {data.avgQuality.toFixed(1)}%
                    </span>
                    <Badge 
                      variant={data.avgQuality >= 95 ? 'default' : data.avgQuality >= 90 ? 'secondary' : 'destructive'} 
                      className="ml-2 text-xs"
                    >
                      {data.avgQuality >= 95 ? 'Excelente' : data.avgQuality >= 90 ? 'Bom' : 'Crítico'}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={data.avgQuality} 
                  className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600" 
                />
                <p className="text-xs text-gray-500 mt-2">Produtos bons vs total produzido</p>
              </div>

              {/* Resumo OEE */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">OEE Global Calculado</p>
                  <p className={`text-4xl font-bold mb-2 ${
                    data.avgOee >= 75 ? 'text-green-600 dark:text-green-400' :
                    data.avgOee >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {data.avgOee.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Disponibilidade × Performance × Qualidade
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.avgAvailability.toFixed(1)}% × {data.avgPerformance.toFixed(1)}% × {data.avgQuality.toFixed(1)}%
                  </p>
                </div>
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
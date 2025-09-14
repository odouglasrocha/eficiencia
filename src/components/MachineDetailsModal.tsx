import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Wrench, 
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  Zap,
  Shield,
  Gauge,
  TrendingUp,
  Eye,
  Settings,
  Sparkles,
  ArrowRight,
  Download,
  Flame,
  Timer,
  Award,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Machine {
  id: string;
  name: string;
  code: string;
  status: "ativa" | "manutencao" | "parada" | "inativa";
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_production: number;
  target_production: number;
}

interface MachineDetailsModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisData {
  criticalCondition: {
    downtime: number;
    affectedOperations: number;
    impactLevel: "CRÍTICO" | "ALTO" | "MÉDIO" | "BAIXO";
    trend: "CRESCENTE" | "ESTÁVEL" | "DECRESCENTE";
  };
  insights: {
    operationsAffected: number;
    potentialReduction: string;
    resolutionTime: string;
    priority: "ALTA" | "MÉDIA" | "BAIXA";
  };
  recommendations: {
    shortTerm: string[];
    mediumTerm: string[];
  };
  risks: string[];
  expectedBenefits: string[];
}

const generateAnalysisData = (machine: Machine): AnalysisData => {
  const isNormal = machine.oee >= 75;
  const isCritical = machine.oee < 65;
  
  if (isNormal) {
    return {
      criticalCondition: {
        downtime: 30,
        affectedOperations: 20,
        impactLevel: "BAIXO",
        trend: "ESTÁVEL"
      },
      insights: {
        operationsAffected: 20,
        potentialReduction: "10-15%",
        resolutionTime: "1-3 dias",
        priority: "BAIXA"
      },
      recommendations: {
        shortTerm: [
          "Manter monitoramento contínuo dos indicadores",
          "Verificar ajustes menores nos parâmetros operacionais",
          "Continuar com manutenção preventiva programada"
        ],
        mediumTerm: [
          "Otimizar processos para máxima eficiência",
          "Implementar melhorias incrementais",
          "Treinar equipe em técnicas avançadas"
        ]
      },
      risks: [
        "Pequena variação na produtividade",
        "Necessidade de ajustes operacionais menores"
      ],
      expectedBenefits: [
        "Manutenção da alta eficiência (>75%)",
        "Produção estável e confiável",
        "Baixo risco operacional"
      ]
    };
  }

  if (isCritical) {
    return {
      criticalCondition: {
        downtime: 240,
        affectedOperations: 100,
        impactLevel: "CRÍTICO",
        trend: "CRESCENTE"
      },
      insights: {
        operationsAffected: 100,
        potentialReduction: "50-70%",
        resolutionTime: "1-2 semanas",
        priority: "ALTA"
      },
      recommendations: {
        shortTerm: [
          "🚨 Investigar imediatamente o registro de parada em 1 máquina",
          "🔧 Acionar equipe de manutenção para análise de falhas críticas",
          "⚡ Implementar correções emergenciais para evitar reincidência",
          "📊 Monitorar indicadores em tempo real para detectar novos sinais"
        ],
        mediumTerm: [
          "🛠️ Criar plano de manutenção preventiva baseado no histórico",
          "🤖 Adotar sistema de alertas preditivos para paradas críticas",
          "📈 Revisar fluxos operacionais para mitigar gargalos",
          "👥 Treinar operadores em resposta rápida a falhas críticas"
        ]
      },
      risks: [
        "Perda contínua de produtividade (acima de 4h/dia)",
        "Redução de até 70% na performance do sistema",
        "Impacto financeiro elevado devido à inatividade prolongada",
        "Efeito cascata em outras operações dependentes"
      ],
      expectedBenefits: [
        "Redução significativa (50-70%) das paradas críticas",
        "Estabilização da produção em curto prazo",
        "Aumento da confiabilidade do sistema",
        "Prevenção de falhas recorrentes"
      ]
    };
  }

  return {
    criticalCondition: {
      downtime: 120,
      affectedOperations: 60,
      impactLevel: "ALTO",
      trend: "CRESCENTE"
    },
    insights: {
      operationsAffected: 60,
      potentialReduction: "25-40%",
      resolutionTime: "3-7 dias",
      priority: "MÉDIA"
    },
    recommendations: {
      shortTerm: [
        "🔍 Investigar causas das paradas não programadas",
        "⚙️ Revisar parâmetros operacionais",
        "📡 Intensificar monitoramento dos indicadores críticos",
        "🎯 Implementar ações corretivas imediatas"
      ],
      mediumTerm: [
        "🔧 Desenvolver plano de manutenção mais robusto",
        "🤖 Implementar sistema de monitoramento preditivo",
        "🎓 Capacitar equipe técnica",
        "🔄 Otimizar fluxos de produção"
      ]
    },
    risks: [
      "Degradação progressiva da performance",
      "Aumento do tempo de paradas não programadas",
      "Impacto na meta de produção mensal",
      "Possível necessidade de manutenção corretiva urgente"
    ],
    expectedBenefits: [
      "Recuperação do OEE para níveis aceitáveis (>75%)",
      "Redução das paradas não programadas",
      "Melhoria na confiabilidade operacional",
      "Otimização dos custos de manutenção"
    ]
  };
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "ALTA": 
      return { 
        color: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25",
        icon: Flame,
        pulse: "animate-pulse-glow"
      };
    case "MÉDIA": 
      return { 
        color: "bg-warning text-warning-foreground shadow-lg shadow-warning/25",
        icon: AlertTriangle,
        pulse: ""
      };
    case "BAIXA": 
      return { 
        color: "bg-success text-success-foreground shadow-lg shadow-success/25",
        icon: CheckCircle2,
        pulse: ""
      };
    default: 
      return { 
        color: "bg-muted text-muted-foreground shadow-lg",
        icon: AlertCircle,
        pulse: ""
      };
  }
};

const getImpactConfig = (impact: string) => {
  switch (impact) {
    case "CRÍTICO": 
      return { 
        color: "text-destructive", 
        bgColor: "bg-destructive/10 border-destructive/30",
        icon: XCircle,
        gradient: "bg-destructive/5"
      };
    case "ALTO": 
      return { 
        color: "text-warning", 
        bgColor: "bg-warning/10 border-warning/30",
        icon: AlertTriangle,
        gradient: "bg-warning/5"
      };
    case "MÉDIO": 
      return { 
        color: "text-primary", 
        bgColor: "bg-primary/10 border-primary/30",
        icon: Clock,
        gradient: "bg-primary/5"
      };
    case "BAIXO": 
      return { 
        color: "text-success", 
        bgColor: "bg-success/10 border-success/30",
        icon: CheckCircle2,
        gradient: "bg-success/5"
      };
    default: 
      return { 
        color: "text-muted-foreground", 
        bgColor: "bg-muted border-border",
        icon: AlertCircle,
        gradient: "bg-muted/50"
      };
  }
};

const getOeeConfig = (oee: number) => {
  if (oee >= 85) return {
    color: "text-success",
    bgGradient: "bg-success",
    icon: Award,
    status: "EXCELENTE"
  };
  if (oee >= 75) return {
    color: "text-primary",
    bgGradient: "bg-primary",
    icon: TrendingUp,
    status: "BOM"
  };
  if (oee >= 65) return {
    color: "text-warning",
    bgGradient: "bg-warning",
    icon: Timer,
    status: "ATENÇÃO"
  };
  return {
    color: "text-destructive",
    bgGradient: "bg-destructive",
    icon: AlertCircle,
    status: "CRÍTICO"
  };
};

export function MachineDetailsModal({ machine, isOpen, onClose }: MachineDetailsModalProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (machine) {
      const analysis = generateAnalysisData(machine);
      setAnalysisData(analysis);
    }
  }, [machine]);

  if (!machine || !analysisData) return null;

  const productionPercentage = Math.min((machine.current_production / machine.target_production) * 100, 100);
  const priorityConfig = getPriorityConfig(analysisData.insights.priority);
  const impactConfig = getImpactConfig(analysisData.criticalCondition.impactLevel);
  const oeeConfig = getOeeConfig(machine.oee);
  const PriorityIcon = priorityConfig.icon;
  const ImpactIcon = impactConfig.icon;
  const OeeIcon = oeeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto glass-morphism border-2 border-primary/20 shadow-2xl">
        {/* Header com gradiente dinâmico */}
        <DialogHeader className="relative overflow-hidden rounded-t-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          <div className="relative z-10 p-6 border-b border-primary/10">
            <DialogTitle className="text-3xl font-bold flex items-center gap-4 mb-4">
              <div className="relative">
                <div className={cn(
                  "p-3 rounded-xl text-white shadow-lg",
                  oeeConfig.bgGradient,
                  "animate-pulse-glow"
                )}>
                  <OeeIcon className="h-8 w-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-bounce-subtle" />
              </div>
              <div>
                <div className="font-semibold text-primary">
                  Análise Avançada - {machine.name}
                </div>
                <div className="text-lg font-normal text-muted-foreground mt-1">
                  Status: {oeeConfig.status}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Análise detalhada de performance, métricas OEE e recomendações para otimização da máquina.
            </DialogDescription>
            
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="outline" className="text-sm font-medium px-3 py-1 hover-lift">
                <Settings className="w-3 h-3 mr-2" />
                Código: {machine.code}
              </Badge>
              <Badge className={cn(
                "text-sm font-semibold px-4 py-2 animate-fade-in",
                priorityConfig.color,
                priorityConfig.pulse
              )}>
                <PriorityIcon className="w-4 h-4 mr-2" />
                🔴 Prioridade: {analysisData.insights.priority}
              </Badge>
              <Badge className={cn("text-sm px-3 py-1", impactConfig.bgColor)}>
                <ImpactIcon className="w-3 h-3 mr-2" />
                Impacto: {analysisData.criticalCondition.impactLevel}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="analysis"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análise Crítica
            </TabsTrigger>
            <TabsTrigger 
              value="actions"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium"
            >
              <Zap className="w-4 h-4 mr-2" />
              Plano de Ação
            </TabsTrigger>
            <TabsTrigger 
              value="risks"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium"
            >
              <Shield className="w-4 h-4 mr-2" />
              Riscos & Benefícios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-fade-up">
            {/* OEE Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: "OEE Geral", 
                  value: machine.oee, 
                  icon: Gauge,
                  gradient: oeeConfig.bgGradient,
                  trend: machine.oee >= 75 ? "+2.3%" : "-1.5%",
                  isMain: true
                },
                { 
                  label: "Disponibilidade", 
                  value: machine.availability, 
                  icon: Clock,
                  gradient: "bg-primary",
                  trend: "+0.8%"
                },
                { 
                  label: "Performance", 
                  value: machine.performance, 
                  icon: TrendingUp,
                  gradient: "bg-accent",
                  trend: "+1.2%"
                },
                { 
                  label: "Qualidade", 
                  value: machine.quality, 
                  icon: Award,
                  gradient: "bg-secondary",
                  trend: "-0.3%"
                }
              ].map((metric, index) => (
                <Card key={index} className={cn(
                  "relative overflow-hidden hover-lift gradient-border",
                  metric.isMain && "ring-2 ring-primary/20 animate-pulse-glow"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "p-3 rounded-xl text-white shadow-lg animate-fade-in",
                        metric.gradient
                      )}>
                        <metric.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs font-medium",
                        metric.trend.startsWith('+') ? "text-success border-success/30" : "text-destructive border-destructive/30"
                      )}>
                        {metric.trend}
                      </Badge>
                    </div>
                    <div className={cn(
                      "text-4xl font-bold mb-2 text-primary",
                      metric.isMain && "animate-pulse"
                    )}>
                      {metric.value.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Produção com Progress Avançado */}
            <Card className="overflow-hidden hover-lift">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                    <Target className="h-5 w-5" />
                  </div>
                  Status da Produção em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Produção Atual</span>
                      <span className="text-2xl font-bold text-primary">
                        {machine.current_production.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Meta Diária</span>
                      <span className="text-2xl font-bold text-muted-foreground">
                        {machine.target_production.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Eficiência</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        productionPercentage >= 90 ? "text-green-500" : 
                        productionPercentage >= 75 ? "text-blue-500" : 
                        productionPercentage >= 50 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {productionPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Progress 
                    value={productionPercentage} 
                    className="h-4 bg-muted/50"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 UND</span>
                    <span className="font-medium">
                      {((productionPercentage / 100) * machine.target_production).toLocaleString()} UND produzidas
                    </span>
                    <span>{machine.target_production.toLocaleString()} UND</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-8 animate-fade-up">
            {/* Situação Crítica */}
            <Card className={cn(
              "overflow-hidden border-2 hover-lift",
              impactConfig.bgColor.includes('red') ? "border-red-500/50 shadow-lg shadow-red-500/10" : 
              impactConfig.bgColor.includes('orange') ? "border-orange-500/50 shadow-lg shadow-orange-500/10" :
              "border-yellow-500/50 shadow-lg shadow-yellow-500/10"
            )}>
              <CardHeader className={impactConfig.gradient}>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className={cn("p-3 rounded-xl text-white animate-wiggle", 
                    analysisData.criticalCondition.impactLevel === "CRÍTICO" ? "bg-red-500" :
                    analysisData.criticalCondition.impactLevel === "ALTO" ? "bg-orange-500" : "bg-yellow-500"
                  )}>
                    <ImpactIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">Situação Identificada</div>
                    <div className="text-base font-normal text-muted-foreground">
                      Nível: {analysisData.criticalCondition.impactLevel}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      icon: Timer,
                      label: "Tempo de Parada",
                      value: `${analysisData.criticalCondition.downtime}min`,
                      subtext: `${(analysisData.criticalCondition.downtime / 60).toFixed(1)}h total`,
                      color: "text-red-500"
                    },
                    {
                      icon: AlertTriangle,
                      label: "Operações Afetadas",
                      value: `${analysisData.criticalCondition.affectedOperations}%`,
                      subtext: "das operações totais",
                      color: "text-orange-500"
                    },
                    {
                      icon: TrendingDown,
                      label: "Tendência",
                      value: analysisData.criticalCondition.trend,
                      subtext: "Padrão identificado",
                      color: "text-yellow-500"
                    },
                    {
                      icon: Bell,
                      label: "Tempo de Resolução",
                      value: analysisData.insights.resolutionTime,
                      subtext: "Estimativa técnica",
                      color: "text-blue-500"
                    }
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="text-center p-4 bg-card/50 rounded-xl border hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={cn("inline-flex p-3 rounded-full mb-3", 
                        item.color === "text-red-500" ? "bg-red-500/10" :
                        item.color === "text-orange-500" ? "bg-orange-500/10" :
                        item.color === "text-yellow-500" ? "bg-yellow-500/10" : "bg-blue-500/10"
                      )}>
                        <item.icon className={cn("h-5 w-5", item.color)} />
                      </div>
                      <div className={cn("text-2xl font-bold mb-1", item.color)}>
                        {item.value}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.subtext}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights Avançados */}
            <Card className="hover-lift">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  Insights da Análise IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      {
                        icon: AlertCircle,
                        text: `${analysisData.insights.operationsAffected}% das operações foram afetadas`,
                        color: "text-destructive"
                      },
                      {
                        icon: TrendingDown,
                        text: `Potencial redução de ${analysisData.insights.potentialReduction}`,
                        color: "text-warning"
                      }
                    ].map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg hover-lift">
                        <div className={cn("p-2 rounded-lg", 
                          insight.color === "text-destructive" ? "bg-destructive/10" : "bg-warning/10"
                        )}>
                          <insight.icon className={cn("h-4 w-4", insight.color)} />
                        </div>
                        <span className="font-medium text-sm">{insight.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        icon: Clock,
                        text: `Tempo estimado: ${analysisData.insights.resolutionTime}`,
                        color: "text-primary"
                      },
                      {
                        icon: Flame,
                        text: `URGENTE - Prioridade ${analysisData.insights.priority}`,
                        color: "text-accent-foreground"
                      }
                    ].map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg hover-lift">
                        <div className={cn("p-2 rounded-lg",
                          insight.color === "text-primary" ? "bg-primary/10" : "bg-accent"
                        )}>
                          <insight.icon className={cn("h-4 w-4", insight.color)} />
                        </div>
                        <span className="font-medium text-sm">{insight.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-8 animate-fade-up">
            {/* Ações de Curto Prazo */}
            <Card className="hover-lift border-destructive/30 shadow-lg shadow-destructive/10">
              <CardHeader className="bg-destructive/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 rounded-xl bg-destructive text-destructive-foreground animate-pulse">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">Ações Críticas - Curto Prazo</div>
                    <div className="text-base font-normal text-muted-foreground">
                      Execução: {analysisData.insights.resolutionTime}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysisData.recommendations.shortTerm.map((action, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 bg-destructive/5 rounded-lg border-l-4 border-destructive hover-lift animate-slide-in-right"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground text-sm flex items-center justify-center font-bold mt-1 animate-bounce-subtle">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{action}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-destructive mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações Preventivas */}
            <Card className="hover-lift border-primary/30 shadow-lg shadow-primary/10">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">Estratégia Preventiva - Médio Prazo</div>
                    <div className="text-base font-normal text-muted-foreground">
                      Implementação: 2-4 semanas
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysisData.recommendations.mediumTerm.map((action, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 bg-blue-500/5 rounded-lg border-l-4 border-blue-500 hover-lift animate-slide-in-right"
                      style={{ animationDelay: `${(index + 4) * 150}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{action}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-8 animate-fade-up">
            {/* Riscos */}
            <Card className="hover-lift border-red-500/30 shadow-lg shadow-red-500/10">
              <CardHeader className="bg-gradient-to-r from-red-500/10 to-pink-500/10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white animate-wiggle">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">Análise de Riscos</div>
                    <div className="text-base font-normal text-muted-foreground">
                      Se as ações não forem executadas
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysisData.risks.map((risk, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 bg-destructive/5 rounded-lg hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="text-sm font-medium flex-1">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefícios Esperados - Design Aprimorado */}
            <Card className="hover-lift border-0 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-500/20 animate-pulse"></div>
                <CardTitle className="flex items-center gap-4 text-xl relative z-10">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 animate-bounce-subtle">
                    <CheckCircle2 className="h-7 w-7 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-2xl drop-shadow-md">Benefícios Esperados</div>
                    <div className="text-emerald-100 font-medium mt-1 drop-shadow-sm">
                      Com a implementação das ações recomendadas
                    </div>
                  </div>
                </CardTitle>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-emerald-300/20 rounded-full blur-lg"></div>
              </CardHeader>
              <CardContent className="p-8 bg-gradient-to-b from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/10">
                <div className="space-y-5">
                  {analysisData.expectedBenefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="group flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                          {benefit}
                        </span>
                        <div className="mt-2 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary footer */}
                <div className="mt-8 p-4 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500 text-white">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        Impacto Esperado: Melhoria significativa na eficiência operacional
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Implementação recomendada em até 30 dias para máximos resultados
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer com botões modernos */}
        <div className="flex justify-between items-center gap-4 pt-6 border-t border-primary/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Powered by Advanced AI Analytics</span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="hover-lift"
            >
              Fechar
            </Button>
            <Button className={cn(
              "bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg hover-lift",
              "hover:shadow-xl hover:shadow-primary/25"
            )}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OeeCard } from "@/components/OeeCard";
import { MachineCard } from "@/components/MachineCard";
import { OeeChart } from "@/components/OeeChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Factory, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Clock,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Play,
  Pause,
  Bell
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  mockOeeHistory,
  mockMachineRanking,
  mockDowntimePareto,
  mockLosses,
  mockSystemMetrics
} from "@/data/mockData";
// import mockMongoService from "@/services/mockMongoService"; // Removido - usando userProfileServiceHybrid
import { useMachines } from "@/hooks/useMachines";
import { useProductionRefresh } from "@/hooks/useProductionRefresh";
import { AddMachineDialog } from "@/components/AddMachineDialog";
import { ProductionDialog } from "@/components/ProductionDialog";
import { DeleteProductionDialog } from "@/components/DeleteProductionDialog";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { ReportsGenerator } from "@/components/ReportsGenerator";
import NotificationSettings from "@/components/NotificationSettings";
import { MachineDetailsModal } from "@/components/MachineDetailsModal";

const Index = () => {
  // console.log('🏭 Index component loading...'); // Removido para evitar spam de logs
  
  // All hooks must be called at the top, before any conditional returns
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);

  // Função para verificar se é admin (local)
  const isAdmin = (): boolean => {
    return user?.roles?.includes('administrador') || false;
  };

  // Não precisamos mais buscar roles separadamente, eles vêm no user
  useEffect(() => {
    setProfileLoading(false);
  }, [user]);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [alerts, setAlerts] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [selectedMachineForProduction, setSelectedMachineForProduction] = useState<string | null>(null);
  // Hooks para gerenciar máquinas e dados
  const { machines, loading, createMachine, updateMachine, deleteMachine, fetchMachines } = useMachines();
  
  // ✅ REFRESH AUTOMÁTICO IMPLEMENTADO
  // Hook para atualizar dados automaticamente após salvar produção
  useProductionRefresh({
    onRefresh: async (event) => {
      console.log('🔄 Atualizando dados após salvar produção:', event);
      // Recarregar dados das máquinas para atualizar KPIs
      await fetchMachines();
    },
    onKPIUpdate: async () => {
      console.log('📊 Atualizando KPIs...');
      await fetchMachines();
    },
    onListUpdate: async () => {
      console.log('📋 Atualizando lista de registros...');
      await fetchMachines();
    }
  });
  const alertedMachinesRef = useRef<Set<string>>(new Set());

  // Simulação de alertas em tempo real
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    const criticalMachines = machines.filter(m => m.oee < 65 && m.status === "ativa");
    setAlerts(criticalMachines.length);

    // Simular alerta para máquinas com OEE baixo - apenas uma vez por máquina
    criticalMachines.forEach((machine) => {
      if (!alertedMachinesRef.current.has(machine.id)) {
        alertedMachinesRef.current.add(machine.id);
        toast({
          title: "⚠️ Alerta de OEE Baixo",
          description: `${machine.name} está com OEE de ${machine.oee.toFixed(1)}% (abaixo de 65%)`,
          variant: "destructive",
        });
      }
    });

    // Remover máquinas que não estão mais críticas dos alertados
    const criticalIds = new Set(criticalMachines.map(m => m.id));
    alertedMachinesRef.current = new Set(
      [...alertedMachinesRef.current].filter(id => criticalIds.has(id))
    );
  }, [machines, toast, isAuthenticated, authLoading]);

  const handleMachineDetails = useCallback((machineId: string) => {
    setSelectedMachine(machineId);
    setIsModalOpen(true);
  }, []);

  const handleToggleMachine = useCallback(async (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    const newStatus = machine.status === "ativa" ? "parada" : "ativa";
    
    try {
      await updateMachine(machineId, { status: newStatus });
      toast({
        title: "Status Alterado",
        description: `${machine.name} está agora ${newStatus === "ativa" ? "ativa" : "parada"}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da máquina",
        variant: "destructive",
      });
    }
  }, [machines, updateMachine, toast]);

  const handleAddProduction = useCallback((machineId: string) => {
    // Armazenar a máquina selecionada e abrir o diálogo
    setSelectedMachineForProduction(machineId);
    setProductionDialogOpen(true);
  }, []);

  const handleDeleteMachine = useCallback(async (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: EXCLUSÃO PERMANENTE\n\n` +
      `Tem certeza que deseja excluir a máquina "${machine.name}" (${machine.code})?\n\n` +
      `Esta ação irá remover PERMANENTEMENTE:\n` +
      `• A máquina do sistema\n` +
      `• Todos os registros de produção\n` +
      `• Todo o histórico OEE\n` +
      `• Todos os dados relacionados\n\n` +
      `Esta ação NÃO PODE ser desfeita!`
    );
    
    if (confirmed) {
      try {
        console.log(`🔄 Iniciando exclusão da máquina: ${machine.name}`);
        
        // Usar a função deleteMachine do hook que já tem a lógica híbrida
        await deleteMachine(machineId);
        
        console.log(`✅ Máquina ${machine.name} excluída com sucesso`);
        
      } catch (error) {
        console.error('❌ Erro ao excluir máquina:', error);
        // O toast de erro já é mostrado pelo hook deleteMachine
      }
    }
  }, [machines, deleteMachine, toast]);

  // Conditional returns after all hooks are called
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        alertCount={alerts}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OeeCard
            title="OEE Médio Geral"
            value={machines.length > 0 ? machines.reduce((sum, m) => sum + m.oee, 0) / machines.length : 0}
            trend="down"
            trendValue={-2.3}
            status="critical"
          />
        <OeeCard
          title="Disponibilidade"
          value={machines.length > 0 ? machines.reduce((sum, m) => sum + m.availability, 0) / machines.length : 0}
          unit="%"
          status="good"
          trend="up"
          trendValue={1.8}
        />
        <OeeCard
          title="Performance"
          value={machines.length > 0 ? machines.reduce((sum, m) => sum + m.performance, 0) / machines.length : 0}
          unit="%"
          status="excellent"
          trend="up"
          trendValue={3.2}
        />
        <OeeCard
          title="Qualidade"
          value={machines.length > 0 ? machines.reduce((sum, m) => sum + m.quality, 0) / machines.length : 0}
          unit="%"
          status="excellent"
          trend="stable"
          trendValue={0.1}
        />
      </div>

        {/* Status do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máquinas Ativas</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {machines.filter(m => m.status === 'ativa').length}/{machines.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {machines.length > 0 ? ((machines.filter(m => m.status === 'ativa').length / machines.length) * 100).toFixed(1) : 0}% operacional
            </p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produção Atual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {machines.reduce((sum, m) => sum + m.current_production, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {machines.reduce((sum, m) => sum + m.target_production, 0).toLocaleString()} UND
            </p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Máquinas com OEE {"<"} 65%
            </p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência Meta</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {machines.length > 0 ? 
                ((machines.reduce((sum, m) => sum + m.current_production, 0) / 
                  machines.reduce((sum, m) => sum + m.target_production, 0)) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Da meta diária
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${isAdmin() ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="machines">Máquinas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            {isAdmin() && (
              <TabsTrigger value="admin">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Gráficos OEE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OeeChart
                type="area"
                title="Evolução OEE (24h)"
                data={mockOeeHistory}
                period="day"
                height={350}
              />
              <OeeChart
                type="bar"
                title="Ranking de Máquinas"
                data={mockMachineRanking}
                period="day"
                height={350}
              />
            </div>

            {/* Perdas e Paradas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OeeChart
                type="pie"
                title="Pareto de Paradas"
                data={mockDowntimePareto}
                height={300}
              />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Perdas por Categoria</CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  {mockLosses.map((loss, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
                        <div>
                          <p className="font-medium text-sm">{loss.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {loss.value} {loss.unit}
                          </p>
                        </div>
                      <Badge variant="outline" className="text-destructive">
                        R$ {loss.cost.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gestão de Máquinas</h2>
                <p className="text-muted-foreground">Monitore e gerencie todas as máquinas do sistema</p>
              </div>
              <AddMachineDialog onAdd={createMachine} />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {machines.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    id={machine.id}
                    name={machine.name}
                    code={machine.code}
                    status={machine.status}
                    oee={machine.oee}
                    availability={machine.availability}
                    performance={machine.performance}
                    quality={machine.quality}
                    currentProduction={machine.current_production}
                    targetProduction={machine.target_production}
                    onViewDetails={handleMachineDetails}
                    onToggleStatus={handleToggleMachine}
                    onAddProduction={handleAddProduction}
                    onDeleteMachine={handleDeleteMachine}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsGenerator />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Configurações de Notificação</h2>
                <p className="text-muted-foreground">Configure alertas e notificações do sistema</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                ✅ Sistema Avançado Ativo
              </Badge>
            </div>
            <NotificationSettings />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">🎉 Funcionalidades Implementadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">🛡️ Sistema de Permissões</h3>
                    <p className="text-sm text-blue-600">3 níveis: Operador, Supervisor, Administrador</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">🔔 Notificações Avançadas</h3>
                    <p className="text-sm text-green-600">Push, Email, WhatsApp com filtros</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800">⚙️ Configurações</h3>
                    <p className="text-sm text-purple-600">Limites, horários e templates</p>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <Badge variant="secondary">Turno corrigido - agora exibe "Noite" corretamente</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes da Máquina */}
        <MachineDetailsModal
          machine={machines.find(m => m.id === selectedMachine) || null}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMachine(null);
          }}
        />

        {/* Dialog de Produção - renderizado apenas quando necessário */}
        <ProductionDialog
          machineId={selectedMachineForProduction || undefined}
          open={productionDialogOpen}
          onOpenChange={setProductionDialogOpen}
          onAdd={async (productionData) => {
            // ✅ REFRESH AUTOMÁTICO - Toast já é exibido no ProductionDialog
            // Apenas fechar dialog e limpar seleção
            setProductionDialogOpen(false);
            setSelectedMachineForProduction(null);
            console.log('🎯 Produção registrada, refresh automático ativado');
          }}
        />
      </main>
    </div>
  );
};

export default Index;
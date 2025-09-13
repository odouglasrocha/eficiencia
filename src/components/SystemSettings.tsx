import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ProtectedRoute, ReadOnlyForOperator } from "./ProtectedRoute";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Settings, 
  Database, 
  Shield, 
  Clock, 
  Bell, 
  Monitor, 
  Wifi,
  Server,
  HardDrive,
  Users,
  Activity,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet
} from "lucide-react";

interface SystemSettingsProps {
  children: React.ReactNode;
}

export function SystemSettings({ children }: SystemSettingsProps) {
  const { toast } = useToast();
  const { 
    canViewSystemSettings, 
    canEditSystemSettings, 
    isOperator, 
    isAdmin, 
    getUserAccessLevel 
  } = useAuthorization();
  const [isLoading, setIsLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    autoBackup: true,
    dataRetention: "90",
    realTimeUpdates: true,
    systemAlerts: true,
    maintenanceMode: false,
    logLevel: "info",
    apiTimeout: "30",
    maxConnections: "100"
  });

  // Mock data para usuários conectados
  const [connectedUsers] = useState([
    {
      id: 1,
      name: "Orlando",
      type: "admin",
      sessions: 1,
      device: "desktop",
      lastSeen: "há menos de um minuto"
    }
  ]);

  // Mock data para métricas do sistema
  const [systemMetrics, setSystemMetrics] = useState({
    connectivity: { status: "Online", latency: "41ms", color: "green" },
    database: { status: "Ativo", connections: 22, color: "green" },
    server: { status: "Estável", uptime: "55m", color: "blue" },
    memory: {
      rss: 86.4,
      heapTotal: 39.9,
      heapUsed: 32.9,
      external: 20.4
    },
    users: {
      onlineNow: 1,
      activeSessions: 1,
      lastHour: 1,
      last24h: 3
    },
    deviceTypes: {
      desktop: 1,
      mobile: 0,
      tablet: 0
    }
  });

  // Atualizar métricas em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        connectivity: {
          ...prev.connectivity,
          latency: Math.floor(Math.random() * 50 + 35) + "ms"
        },
        database: {
          ...prev.database,
          connections: Math.floor(Math.random() * 10 + 20)
        },
        server: {
          ...prev.server,
          uptime: Math.floor(Math.random() * 120 + 50) + "m"
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateConfig = (key: string, value: string | boolean) => {
    setSystemConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento - aqui você integraria com sua API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setSystemConfig({
      autoBackup: true,
      dataRetention: "90",
      realTimeUpdates: true,
      systemAlerts: true,
      maintenanceMode: false,
      logLevel: "info",
      apiTimeout: "30",
      maxConnections: "100"
    });

    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas para os valores padrão.",
    });
  };

  return (
    <ProtectedRoute requiredPermissions={['view_system_settings']}>
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurações do Sistema
              {/* Indicador de Modo de Acesso - Sistema de Segurança Restaurado */}
              {isOperator() && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Somente Leitura
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure as preferências e parâmetros do sistema OEE
              {isOperator() && (
                <Alert className="mt-2">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Modo Operador</AlertTitle>
                  <AlertDescription>
                    Você pode visualizar as configurações mas não pode editá-las.
                  </AlertDescription>
                </Alert>
              )}
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-6">
          {/* Usuários Conectados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Usuários Conectados
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm">
                    Limpar Sessões
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas de usuários */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">Online Agora</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {systemMetrics.users.onlineNow}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Monitor className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Sessões Ativas</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {systemMetrics.users.activeSessions}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">Última Hora</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {systemMetrics.users.lastHour}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Server className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-800">Últimas 24h</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {systemMetrics.users.last24h}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de usuários online */}
              <div>
                <h4 className="text-sm font-medium mb-3">Usuários Online ({connectedUsers.length})</h4>
                <div className="space-y-2">
                  {connectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            {user.type} • {user.sessions} sessão(ões)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{user.lastSeen}</div>
                        <div className="text-sm font-medium">{user.device}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por Tipo de Dispositivo */}
              <div>
                <h4 className="text-sm font-medium mb-3">Por Tipo de Dispositivo</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Desktop</span>
                    </div>
                    <span className="font-medium">{systemMetrics.deviceTypes.desktop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Mobile</span>
                    </div>
                    <span className="font-medium">{systemMetrics.deviceTypes.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Tablet</span>
                    </div>
                    <span className="font-medium">{systemMetrics.deviceTypes.tablet}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-green-600" />
                  Status do Sistema
                </CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Conectividade</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {systemMetrics.connectivity.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{systemMetrics.connectivity.latency}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Banco de Dados</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {systemMetrics.database.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{systemMetrics.database.connections} conexões</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Servidor</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {systemMetrics.server.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">Uptime: {systemMetrics.server.uptime}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Uso de Memória */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Uso de Memória
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">RSS:</div>
                    <div className="text-lg font-bold">{systemMetrics.memory.rss} <span className="text-sm font-normal">MB</span></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Heap Total:</div>
                    <div className="text-lg font-bold">{systemMetrics.memory.heapTotal} <span className="text-sm font-normal">MB</span></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Heap Usado:</div>
                    <div className="text-lg font-bold">{systemMetrics.memory.heapUsed} <span className="text-sm font-normal">MB</span></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Externo:</div>
                    <div className="text-lg font-bold">{systemMetrics.memory.external} <span className="text-sm font-normal">MB</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Defina as configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Realiza backup automático dos dados diariamente
                  </p>
                </div>
                <Switch
                  checked={systemConfig.autoBackup}
                  onCheckedChange={(checked) => updateConfig("autoBackup", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Atualizações em Tempo Real</Label>
                  <p className="text-sm text-muted-foreground">
                    Atualiza os dados automaticamente no dashboard
                  </p>
                </div>
                <Switch
                  checked={systemConfig.realTimeUpdates}
                  onCheckedChange={(checked) => updateConfig("realTimeUpdates", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Alertas do Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre o status do sistema
                  </p>
                </div>
                <Switch
                  checked={systemConfig.systemAlerts}
                  onCheckedChange={(checked) => updateConfig("systemAlerts", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
                  <Select
                    value={systemConfig.dataRetention}
                    onValueChange={(value) => updateConfig("dataRetention", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logLevel">Nível de Log</Label>
                  <Select
                    value={systemConfig.logLevel}
                    onValueChange={(value) => updateConfig("logLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">Timeout API (segundos)</Label>
                  <Select
                    value={systemConfig.apiTimeout}
                    onValueChange={(value) => updateConfig("apiTimeout", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">60 segundos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConnections">Máx. Conexões</Label>
                  <Select
                    value={systemConfig.maxConnections}
                    onValueChange={(value) => updateConfig("maxConnections", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 conexões</SelectItem>
                      <SelectItem value="100">100 conexões</SelectItem>
                      <SelectItem value="200">200 conexões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Desativa temporariamente o sistema para manutenção
                  </p>
                </div>
                <Switch
                  checked={systemConfig.maintenanceMode}
                  onCheckedChange={(checked) => updateConfig("maintenanceMode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação - Controle de Acesso Baseado em Permissões */}
          <div className="flex justify-end gap-3">
            {canEditSystemSettings() ? (
              // Administradores podem editar
              <>
                <Button 
                  variant="outline" 
                  onClick={handleResetDefaults}
                  disabled={isLoading}
                >
                  Resetar Padrões
                </Button>
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </>
            ) : (
              // Operadores e Supervisores - Somente visualização
              <Alert className="w-full">
                <Shield className="h-4 w-4" />
                <AlertTitle>Acesso Restrito</AlertTitle>
                <AlertDescription>
                  Você tem permissão apenas para visualizar as configurações.
                  Entre em contato com um administrador para fazer alterações.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </ProtectedRoute>
  );
}
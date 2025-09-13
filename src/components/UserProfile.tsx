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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Shield,
  Camera,
  Key,
  Bell,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
// Removido import do Supabase - usando dados do contexto
import { AdvancedNotificationSettings } from "./AdvancedNotificationSettings";

interface UserProfileProps {
  children: React.ReactNode;
}

export function UserProfile({ children }: UserProfileProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const { user } = useAuth();

  // Buscar perfil do usuário
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Usar dados do contexto de autenticação
        const profileData = {
          user_id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url,
          phone: null,
          department: null,
          position: null,
          location: null,
          bio: null,
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: { email: true, push: true, whatsapp: false },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const rolesData = (user.roles || ['operador']).map((role, index) => ({
          id: `role_${index}`,
          user_id: user.id,
          role: role,
          created_at: new Date().toISOString()
        }));

        setProfile(profileData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (key: string, value: any) => {
    if (!profile || !user) return;

    try {
      let updateData: any = {};
      
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (parent === 'notifications') {
          const updatedNotifications = {
            ...profile.notifications,
            [child]: value
          };
          updateData = { notifications: updatedNotifications };
        }
      } else {
        updateData = { [key]: value };
      }

      // Atualizar perfil localmente (mock)
      const updatedProfile = {
        ...profile,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      setProfile(updatedProfile);
      
      // Salvar no localStorage para persistência
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    }
  };

  const getPrimaryRole = (): string | null => {
    if (roles.length === 0) return null;
    
    // Prioridade: administrador > supervisor > operador
    if (roles.some((r: any) => r.role === 'administrador')) return 'administrador';
    if (roles.some((r: any) => r.role === 'supervisor')) return 'supervisor';
    return 'operador';
  };

  const getRoleConfig = (role: string | null) => {
    switch (role) {
      case "administrador":
        return { 
          color: "bg-primary/15 text-primary border-primary/30", 
          text: "Administrador",
          icon: Shield
        };
      case "supervisor":
        return { 
          color: "bg-oee-good/15 text-oee-good border-oee-good/30", 
          text: "Supervisor",
          icon: User
        };
      case "operador":
        return { 
          color: "bg-warning/15 text-warning border-warning/30", 
          text: "Operador",
          icon: Briefcase
        };
      default:
        return { 
          color: "bg-muted/50 text-muted-foreground border-muted", 
          text: "Usuário",
          icon: User
        };
    }
  };

  const primaryRole = getPrimaryRole();
  const roleConfig = getRoleConfig(primaryRole);

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Simulação de mudança de senha (mock)
      // Em um sistema real, isso seria feito no backend
      
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso! (simulação)",
      });
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangePasswordOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Upload de foto",
      description: "Funcionalidade será implementada em breve.",
    });
  };

  if (loading || !profile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Perfil do Usuário
          </DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e preferências
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || "Usuário"} />
                    <AvatarFallback className="text-2xl">
                      {(profile.full_name || user?.email || "U").split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleUploadPhoto}
                  >
                    <Camera className="h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <Badge 
                    variant="outline" 
                    className={`text-xs border ${roleConfig.color}`}
                  >
                    <roleConfig.icon className="h-3 w-3 mr-1" />
                    {roleConfig.text}
                  </Badge>
                </div>

                {/* Formulário */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profile.full_name || ""}
                        onChange={(e) => handleUpdateProfile("full_name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10"
                          value={user?.email || ""}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          className="pl-10"
                          value={profile.phone || ""}
                          onChange={(e) => handleUpdateProfile("phone", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Departamento</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="department"
                          className="pl-10"
                          value={profile.department || ""}
                          onChange={(e) => handleUpdateProfile("department", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Cargo</Label>
                      <Select
                        value={profile.position || ""}
                        onValueChange={(value) => handleUpdateProfile("position", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Operador">Operador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          className="pl-10"
                          value={profile.location || ""}
                          onChange={(e) => handleUpdateProfile("location", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="Conte um pouco sobre você..."
                      value={profile.bio || ""}
                      onChange={(e) => handleUpdateProfile("bio", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => handleUpdateProfile("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => handleUpdateProfile("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas e relatórios por email
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.email}
                  onCheckedChange={(checked) => handleUpdateProfile("notifications.email", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações no navegador
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.push}
                  onCheckedChange={(checked) => handleUpdateProfile("notifications.push", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas críticos via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.whatsapp}
                  onCheckedChange={(checked) => handleUpdateProfile("notifications.whatsapp", checked)}
                />
              </div>

              <Separator />

              <div className="pt-2">
                <AdvancedNotificationSettings>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações Avançadas de Notificação
                  </Button>
                </AdvancedNotificationSettings>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure tipos de alertas, frequência, canais WhatsApp e mais
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Permissões e Nível de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões e Nível de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Função Principal</Label>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${roleConfig.color} text-sm px-3 py-1`}
                    >
                      <roleConfig.icon className="h-4 w-4 mr-2" />
                      {roleConfig.text}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Todas as Funções</Label>
                  <div className="flex flex-wrap gap-1">
                    {roles.length > 0 ? roles.map((role: any) => {
                      const config = getRoleConfig(role.role);
                      return (
                        <Badge 
                          key={role.id}
                          variant="secondary" 
                          className="text-xs"
                        >
                          <config.icon className="h-3 w-3 mr-1" />
                          {config.text}
                        </Badge>
                      );
                    }) : (
                      <span className="text-sm text-muted-foreground">Nenhuma função atribuída</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Permissões de Acesso</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Visualizar Dashboard</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Inserir Produção</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Gerenciar Máquinas</span>
                    {primaryRole === 'administrador' || primaryRole === 'supervisor' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Gerenciar Usuários</span>
                    {primaryRole === 'administrador' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Relatórios Avançados</span>
                    {primaryRole === 'administrador' || primaryRole === 'supervisor' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Configurações Sistema</span>
                    {primaryRole === 'administrador' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {primaryRole !== 'administrador' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Para solicitar permissões adicionais, entre em contato com um administrador do sistema.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangePasswordOpen ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Digite a nova senha novamente"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangePasswordOpen(false);
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={isLoading}
                    >
                      {isLoading ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Sessão ativa desde: {new Date().toLocaleString('pt-BR')}</p>
                <p>Conta criada em: {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informação sobre salvamento automático */}
          <div className="text-center text-sm text-muted-foreground">
            <p>As alterações são salvas automaticamente</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
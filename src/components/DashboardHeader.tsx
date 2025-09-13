import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  Factory, 
  TrendingUp,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SystemSettings } from "./SystemSettings";
import { UserProfile } from "./UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  alertCount?: number;
  className?: string;
}

export function DashboardHeader({ 
  alertCount = 0,
  className 
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { 
    canViewSystemSettings, 
    canViewProfile, 
    getUserAccessLevel,
    isAdmin,
    isOperator,
    isSupervisor 
  } = useAuthorization();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  // Usar dados do usuário do contexto de autenticação
  useEffect(() => {
    if (user) {
      // Os dados do usuário já vêm do contexto, incluindo roles
      setProfile({
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email: user.email
      });
      
      // Converter roles para formato esperado
      const userRoles = user.roles?.map(role => ({ role })) || [];
      setRoles(userRoles);
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleConfig = (role: string | null) => {
    switch (role) {
      case "administrador":
        return { color: "bg-primary/15 text-primary border-primary/30", text: "Administrador" };
      case "supervisor":
        return { color: "bg-oee-good/15 text-oee-good border-oee-good/30", text: "Supervisor" };
      case "operador":
        return { color: "bg-warning/15 text-warning border-warning/30", text: "Operador" };
      default:
        return { color: "bg-muted/50 text-muted-foreground border-muted", text: "Usuário" };
    }
  };

  const getPrimaryRole = (): string | null => {
    if (roles.length === 0) return null;
    
    // Prioridade: administrador > supervisor > operador
    if (roles.some((r: any) => r.role === 'administrador')) return 'administrador';
    if (roles.some((r: any) => r.role === 'supervisor')) return 'supervisor';
    return 'operador';
  };

  const primaryRole = getPrimaryRole();
  const roleConfig = getRoleConfig(primaryRole);
  const displayName = profile?.full_name || "Usuário";

  return (
    <header className={cn(
      "flex items-center justify-between p-4 bg-card border-b border-border",
      "backdrop-blur-sm bg-card/80",
      className
    )}>
      {/* Logo e Título */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Sistema OEE
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento Industrial
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores Centrais */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 bg-oee-excellent/10 border border-oee-excellent/20 rounded-lg">
          <TrendingUp className="h-4 w-4 text-oee-excellent" />
          <span className="text-sm font-medium text-oee-excellent">
            Sistema Online
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Ações do Usuário */}
      <div className="flex items-center space-x-3">
        {/* Alertas */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0",
                alertCount >= 10 && "px-1 w-auto min-w-[20px]",
                alertCount > 0 && "animate-pulse"
              )}
            >
              {alertCount > 99 ? "99+" : alertCount}
            </Badge>
          )}
        </Button>

        {/* Toggle Tema */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Perfil do Usuário */}
        <div className="flex items-center space-x-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {profileLoading ? "Carregando..." : displayName}
            </p>
            <Badge 
              variant="outline" 
              className={cn("text-xs border", roleConfig.color)}
            >
              {roleConfig.text}
            </Badge>
            {/* Indicador de Nível de Acesso - Sistema de Segurança */}
            <p className="text-xs text-muted-foreground mt-1">
              Nível: {getUserAccessLevel().toUpperCase()}
            </p>
          </div>
          {/* Perfil - Disponível para todos os usuários autenticados */}
          {canViewProfile() && (
            <UserProfile>
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </UserProfile>
          )}
        </div>

        {/* Configurações - Controle de Acesso Baseado em Permissões */}
        {canViewSystemSettings() && (
          <SystemSettings>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
              {/* Indicador visual para operadores (somente leitura) */}
              {isOperator() && (
                <span className="ml-1 text-xs opacity-60">(Visualizar)</span>
              )}
            </Button>
          </SystemSettings>
        )}

        {/* Sair */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationSettings {
  id?: string;
  user_id: string;
  machine_ids: string[];
  notification_types: {
    push: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  alert_types: {
    oee: boolean;
    downtime: boolean;
    production: boolean;
    maintenance: boolean;
    quality: boolean;
  };
  thresholds: {
    oee_min: number;
    downtime_max: number;
    production_min: number;
  };
  schedule: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
    days: number[];
  };
  frequency_minutes: number;
  escalation: {
    enabled: boolean;
    levels: any[];
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  active: boolean;
}

export interface SystemSettings {
  notification_templates: {
    oee_alert: string;
    downtime_alert: string;
    production_alert: string;
  };
  alert_thresholds: {
    oee_critical: number;
    oee_warning: number;
    downtime_critical: number;
    downtime_warning: number;
    production_critical: number;
    production_warning: number;
  };
  whatsapp_config: {
    enabled: boolean;
    api_key: string;
    business_id: string;
    webhook_url: string;
    phone_number: string;
  };
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar configurações do usuário (mock)
  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      const savedSettings = localStorage.getItem(`notification_settings_${user.id}`);
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Configurações padrão
        const defaultSettings: NotificationSettings = {
          id: `settings_${user.id}`,
          user_id: user.id,
          machine_ids: [],
          notification_types: {
            push: true,
            email: true,
            whatsapp: false,
            sms: false
          },
          alert_types: {
            oee: true,
            downtime: true,
            production: true,
            maintenance: true,
            quality: false
          },
          thresholds: {
            oee_min: 70,
            downtime_max: 30,
            production_min: 80
          },
          schedule: {
            enabled: true,
            start_hour: 6,
            end_hour: 18,
            days: [1, 2, 3, 4, 5] // Segunda a sexta
          },
          frequency_minutes: 30,
          escalation: {
            enabled: false,
            levels: []
          },
          quiet_hours: {
            enabled: true,
            start: '22:00',
            end: '06:00'
          },
          active: true
        };
        
        setSettings(defaultSettings);
        localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(defaultSettings));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Carregar configurações do sistema (mock)
  const fetchSystemSettings = async () => {
    try {
      const defaultSystemSettings: SystemSettings = {
        notification_templates: {
          oee_alert: 'OEE da máquina {machine_name} está em {oee_value}%',
          downtime_alert: 'Máquina {machine_name} parada há {duration} minutos',
          production_alert: 'Produção da máquina {machine_name}: {production_value}'
        },
        alert_thresholds: {
          oee_critical: 50,
          oee_warning: 70,
          downtime_critical: 60,
          downtime_warning: 30,
          production_critical: 50,
          production_warning: 70
        },
        whatsapp_config: {
          enabled: false,
          api_key: '',
          business_id: '',
          webhook_url: '',
          phone_number: ''
        }
      };
      
      setSystemSettings(defaultSystemSettings);
    } catch (err) {
      console.error('Erro ao carregar configurações do sistema:', err);
    }
  };

  // Criar ou atualizar configurações do usuário (mock)
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        user_id: user.id
      } as NotificationSettings;

      setSettings(updatedSettings);
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(updatedSettings));
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
      
      return updatedSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Testar notificação
  const testNotification = async (type: 'email' | 'whatsapp' | 'push') => {
    try {
      toast({
        title: "Teste de Notificação",
        description: `Notificação de teste ${type} enviada com sucesso!`,
      });
      
      return { success: true, message: `Teste ${type} enviado` };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao testar notificação';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Resetar para padrões
  const resetToDefaults = async () => {
    if (!user) return;
    
    localStorage.removeItem(`notification_settings_${user.id}`);
    await fetchUserSettings();
    
    toast({
      title: "Sucesso",
      description: "Configurações resetadas para os valores padrão!",
    });
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchUserSettings(),
        fetchSystemSettings()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  return {
    settings,
    systemSettings,
    loading,
    error,
    saveSettings,
    testNotification,
    resetToDefaults,
    refetch: () => {
      if (user) {
        fetchUserSettings();
        fetchSystemSettings();
      }
    }
  };
}
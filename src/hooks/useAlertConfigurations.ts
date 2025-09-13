import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationTypes {
  email: boolean;
  push: boolean;
  sound: boolean;
  whatsapp: boolean;
}

export interface AlertTypes {
  oee: boolean;
  downtime: boolean;
  maintenance: boolean;
  production: boolean;
}

export interface Recipients {
  emails: string[];
  whatsapp_numbers: string[];
}

export interface AdvancedSettings {
  critical_only: boolean;
  summary_reports: boolean;
  whatsapp_template: string;
}

export interface WhatsAppConfig {
  api_key: string;
  webhook_url: string;
  business_id: string;
  connected: boolean;
}

export interface AlertConfiguration {
  id: string;
  user_id: string;
  notification_types: NotificationTypes;
  alert_types: AlertTypes;
  alert_level: 'high' | 'medium' | 'low';
  frequency: number;
  recipients: Recipients;
  advanced_settings: AdvancedSettings;
  whatsapp_config: WhatsAppConfig;
  created_at?: string;
  updated_at?: string;
}

export function useAlertConfigurations() {
  const [configuration, setConfiguration] = useState<AlertConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      
      // Buscar configuração do localStorage ou criar padrão
      const savedConfig = localStorage.getItem(`alert_config_${user?.id || 'default'}`);
      
      if (savedConfig) {
        setConfiguration(JSON.parse(savedConfig));
      } else {
        // Configuração padrão
        const defaultConfig: AlertConfiguration = {
          id: `config_${user?.id || 'default'}`,
          user_id: user?.id || 'default',
          notification_types: {
            email: true,
            push: true,
            sound: false,
            whatsapp: false
          },
          alert_types: {
            oee: true,
            downtime: true,
            maintenance: true,
            production: false
          },
          alert_level: 'medium',
          frequency: 30,
          recipients: {
            emails: [user?.email || 'admin@sistema-oee.com'],
            whatsapp_numbers: []
          },
          advanced_settings: {
            critical_only: false,
            summary_reports: true,
            whatsapp_template: 'Alerta OEE: {message}'
          },
          whatsapp_config: {
            api_key: '',
            webhook_url: '',
            business_id: '',
            connected: false
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setConfiguration(defaultConfig);
        localStorage.setItem(`alert_config_${user?.id || 'default'}`, JSON.stringify(defaultConfig));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (updates: Partial<AlertConfiguration>) => {
    try {
      if (!configuration) return;

      const updatedConfig = {
        ...configuration,
        ...updates,
        updated_at: new Date().toISOString()
      };

      setConfiguration(updatedConfig);
      localStorage.setItem(`alert_config_${user?.id || 'default'}`, JSON.stringify(updatedConfig));
      
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso!",
      });
      
      return updatedConfig;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfiguration();
    }
  }, [user]);

  return {
    configuration,
    loading,
    error,
    updateConfiguration,
    refetch: fetchConfiguration,
  };
}
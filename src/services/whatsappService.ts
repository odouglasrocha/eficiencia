import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppConfig {
  api_key: string;
  webhook_url: string;
  business_id: string;
  connected: boolean;
}

export interface AlertData {
  machine_name: string;
  alert_type: string;
  current_value: number;
  threshold: number;
  timestamp: string;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  
  private constructor() {}
  
  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Conecta com a API do WhatsApp
   */
  async connectWhatsApp(config: WhatsAppConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect', {
        body: { config }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Envia alerta via WhatsApp
   */
  async sendWhatsAppAlert(
    phoneNumber: string, 
    messageTemplate: string, 
    alertData: AlertData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Formatar a mensagem substituindo os placeholders
      const formattedMessage = this.formatMessage(messageTemplate, alertData);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: { 
          phoneNumber, 
          message: formattedMessage,
          alertData 
        }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar alerta WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Testa a conexão com a API do WhatsApp
   */
  async testConnection(config: WhatsAppConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-test', {
        body: { config }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao testar conexão WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Valida número de telefone internacional
   */
  validatePhoneNumber(number: string): { valid: boolean; error?: string } {
    // Remove espaços e caracteres especiais, mantendo apenas + e números
    const cleanNumber = number.replace(/[^\+\d]/g, '');
    
    // Verifica formato internacional (+código_país + número)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    
    if (!phoneRegex.test(cleanNumber)) {
      return {
        valid: false,
        error: 'Número deve estar no formato internacional (+55xxxxxxxxxx)'
      };
    }
    
    // Verificações adicionais
    if (cleanNumber.length < 10 || cleanNumber.length > 16) {
      return {
        valid: false,
        error: 'Número deve ter entre 10 e 16 dígitos'
      };
    }
    
    return { valid: true };
  }

  /**
   * Envia mensagem de teste
   */
  async sendTestMessage(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessage = `🔧 Teste de Conexão OEE Monitor\n\nSua configuração WhatsApp está funcionando corretamente!\n\nHorário: ${new Date().toLocaleString('pt-BR')}`;
      
      const { data, error } = await supabase.functions.invoke('whatsapp-send-test', {
        body: { 
          phoneNumber, 
          message: testMessage
        }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Verifica status da conexão WhatsApp
   */
  async getConnectionStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-status');

      if (error) throw error;
      
      return { connected: data?.connected || false };
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
      return { 
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Formata mensagem substituindo placeholders pelos dados do alerta
   */
  private formatMessage(template: string, alertData: AlertData): string {
    return template
      .replace(/\{\{machine_name\}\}/g, alertData.machine_name)
      .replace(/\{\{alert_type\}\}/g, alertData.alert_type)
      .replace(/\{\{current_value\}\}/g, alertData.current_value.toString())
      .replace(/\{\{threshold\}\}/g, alertData.threshold.toString())
      .replace(/\{\{timestamp\}\}/g, alertData.timestamp);
  }

  /**
   * Envia alertas para múltiplos números
   */
  async sendBulkAlerts(
    phoneNumbers: string[], 
    messageTemplate: string, 
    alertData: AlertData
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    const promises = phoneNumbers.map(async (phoneNumber) => {
      const result = await this.sendWhatsAppAlert(phoneNumber, messageTemplate, alertData);
      if (!result.success && result.error) {
        errors.push(`${phoneNumber}: ${result.error}`);
      }
      return result.success;
    });
    
    const results = await Promise.all(promises);
    const success = results.every(result => result);
    
    return { success, errors };
  }
}

// Export singleton instance
export const whatsappService = WhatsAppService.getInstance();
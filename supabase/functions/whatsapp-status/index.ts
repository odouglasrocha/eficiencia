import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configurações do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('alert_configurations')
      .select('whatsapp_config, notification_types')
      .eq('user_id', 'default')
      .single();

    if (configError || !config) {
      console.error('Erro ao buscar configurações:', configError);
      return new Response(
        JSON.stringify({ 
          connected: false,
          error: 'Configurações não encontradas' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const whatsappConfig = config.whatsapp_config;
    const notificationTypes = config.notification_types;
    
    // Verificar se WhatsApp está habilitado
    if (!notificationTypes.whatsapp) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          enabled: false,
          message: 'Notificações WhatsApp desabilitadas'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se tem configurações básicas
    if (!whatsappConfig.api_key || !whatsappConfig.business_id) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          enabled: true,
          configured: false,
          message: 'Configurações WhatsApp incompletas'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Testar conexão se as configurações estão presentes
    let connectionTest = false;
    let businessInfo = null;
    
    try {
      const testResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.business_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${whatsappConfig.api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (testResponse.ok) {
        connectionTest = true;
        businessInfo = await testResponse.json();
      }
    } catch (error) {
      console.log('Erro no teste de conexão:', error);
      connectionTest = false;
    }

    return new Response(
      JSON.stringify({ 
        connected: connectionTest && whatsappConfig.connected,
        enabled: notificationTypes.whatsapp,
        configured: true,
        business_info: businessInfo,
        last_check: new Date().toISOString(),
        config_status: {
          has_api_key: !!whatsappConfig.api_key,
          has_business_id: !!whatsappConfig.business_id,
          has_webhook_url: !!whatsappConfig.webhook_url
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao verificar status WhatsApp:', error);
    
    return new Response(
      JSON.stringify({ 
        connected: false,
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
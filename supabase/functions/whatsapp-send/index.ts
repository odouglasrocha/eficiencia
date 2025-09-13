import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  alertData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, message, alertData }: SendMessageRequest = await req.json();
    
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone e mensagem são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar formato do número
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Formato de número inválido. Use formato internacional (+55xxxxxxxxxx)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configurações do WhatsApp
    const { data: config, error: configError } = await supabase
      .from('alert_configurations')
      .select('whatsapp_config')
      .eq('user_id', 'default')
      .single();

    if (configError || !config) {
      console.error('Erro ao buscar configurações:', configError);
      return new Response(
        JSON.stringify({ error: 'Configurações WhatsApp não encontradas' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const whatsappConfig = config.whatsapp_config;
    
    if (!whatsappConfig.api_key || !whatsappConfig.business_id) {
      return new Response(
        JSON.stringify({ error: 'Configurações WhatsApp incompletas' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remover o "+" do número para a API do WhatsApp
    const cleanPhoneNumber = phoneNumber.replace('+', '');

    // Enviar mensagem via WhatsApp Business API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.business_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber,
        type: 'text',
        text: {
          body: message
        }
      }),
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json();
      console.error('Erro ao enviar mensagem WhatsApp:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao enviar mensagem WhatsApp',
          details: errorData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await whatsappResponse.json();
    console.log('Mensagem WhatsApp enviada com sucesso:', responseData);
    
    // Log do alerta enviado (opcional)
    if (alertData) {
      await supabase
        .from('alerts')
        .insert([{
          type: 'whatsapp',
          message: `Alerta enviado via WhatsApp para ${phoneNumber}`,
          severity: 'info',
          machine_id: alertData.machine_id || null,
        }]);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mensagem WhatsApp enviada com sucesso',
        whatsapp_response: responseData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
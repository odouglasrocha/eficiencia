import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppConfig {
  api_key: string;
  webhook_url: string;
  business_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config }: { config: WhatsAppConfig } = await req.json();
    
    if (!config.api_key || !config.business_id) {
      return new Response(
        JSON.stringify({ error: 'API Key e Business ID são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Testando conexão WhatsApp para Business ID:', config.business_id);

    // Testar conexão com WhatsApp Business API
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/${config.business_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      console.error('Erro no teste de conexão:', errorData);
      
      let errorMessage = 'Falha na conexão com WhatsApp Business API';
      
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (testResponse.status === 401) {
        errorMessage = 'API Key inválida';
      } else if (testResponse.status === 404) {
        errorMessage = 'Business ID não encontrado';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorData,
          status: testResponse.status
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const businessData = await testResponse.json();
    console.log('Teste de conexão bem-sucedido:', businessData);

    // Verificar se tem permissões para envio de mensagens
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/${config.business_id}/phone_numbers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    let phoneNumbers = [];
    if (permissionsResponse.ok) {
      const phoneData = await permissionsResponse.json();
      phoneNumbers = phoneData.data || [];
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Conexão WhatsApp testada com sucesso',
        business_info: {
          id: businessData.id,
          name: businessData.name,
          phone_numbers: phoneNumbers
        },
        connection_status: 'connected',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao testar conexão WhatsApp:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        connection_status: 'failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
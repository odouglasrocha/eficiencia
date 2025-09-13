import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

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

    // Simular teste de conexão com WhatsApp Business API
    // Em produção, aqui você faria uma chamada real para a API do WhatsApp
    const testConnection = await fetch(`https://graph.facebook.com/v18.0/${config.business_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testConnection.ok) {
      const errorData = await testConnection.json();
      console.error('Erro na conexão WhatsApp:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Falha na conexão com WhatsApp Business API',
          details: errorData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Se chegou até aqui, a conexão foi bem-sucedida
    console.log('Conexão WhatsApp estabelecida com sucesso');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Conexão WhatsApp estabelecida com sucesso',
        business_info: await testConnection.json()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
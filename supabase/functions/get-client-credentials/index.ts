// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔑 Getting client credentials...');
    
    // Get credentials from Supabase secrets
    const mcpClientBaseUrl = Deno.env.get('MCP_CLIENT_BASE_URL');
    const mcpApiKey = Deno.env.get('MCP_API_KEY');
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('📋 Credential status check:');
    console.log('MCP_CLIENT_BASE_URL:', mcpClientBaseUrl ? `✅ SET (${mcpClientBaseUrl})` : '❌ NOT SET');
    console.log('MCP_API_KEY:', mcpApiKey ? '✅ SET' : '❌ NOT SET');
    console.log('OPENAI_API_KEY:', openAIKey ? '✅ SET' : '❌ NOT SET');
    console.log('ANTHROPIC_API_KEY:', anthropicApiKey ? '✅ SET' : '❌ NOT SET');

    // Check for required credentials
    const missingCredentials = [];
    if (!mcpClientBaseUrl) missingCredentials.push('MCP_CLIENT_BASE_URL');
    if (!mcpApiKey) missingCredentials.push('MCP_API_KEY');
    if (!openAIKey) missingCredentials.push('OPENAI_API_KEY');

    if (missingCredentials.length > 0) {
      console.error('❌ Missing required credentials:', missingCredentials);
      return new Response(JSON.stringify({ 
        error: 'Missing required credentials',
        missing: missingCredentials,
        details: `Please configure the following secrets in Supabase: ${missingCredentials.join(', ')}`,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate MCP Client Base URL format
    if (mcpClientBaseUrl && (!mcpClientBaseUrl.startsWith('http://') && !mcpClientBaseUrl.startsWith('https://'))) {
      console.error('❌ Invalid MCP_CLIENT_BASE_URL format:', mcpClientBaseUrl);
      return new Response(JSON.stringify({ 
        error: 'Invalid MCP_CLIENT_BASE_URL format',
        details: 'URL must start with http:// or https://',
        received: mcpClientBaseUrl,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Successfully validated all required credentials');

    // Return credentials in the expected format
    const credentials = {
      mcpClientBaseUrl,
      mcpApiKey,
      openAIKey,
      anthropicApiKey: anthropicApiKey || null,
      success: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    console.log('📤 Returning credentials to client');
    
    return new Response(JSON.stringify(credentials), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error retrieving client credentials:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
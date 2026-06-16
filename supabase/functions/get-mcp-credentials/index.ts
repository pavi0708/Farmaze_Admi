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
    // Get the authenticated user from Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing authorization header',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔑 Authenticated MCP Credentials Function - Getting credentials for authenticated user...');
    
    // Get all possible MCP-related credentials from Supabase secrets
    const mcpClientBaseUrl = Deno.env.get('MCP_CLIENT_BASE_URL'); // Primary URL for client
    const mcpServerURL = Deno.env.get('MCP_SERVER_URL'); // Alternative URL for server
    const mcpApiKey = Deno.env.get('MCP_API_KEY');
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('📋 Credential status check:');
    console.log('MCP_CLIENT_BASE_URL:', mcpClientBaseUrl ? `✅ SET (${mcpClientBaseUrl})` : '❌ NOT SET');
    console.log('MCP_SERVER_URL:', mcpServerURL ? `✅ SET (${mcpServerURL})` : '❌ NOT SET');
    console.log('MCP_API_KEY:', mcpApiKey ? '✅ SET' : '❌ NOT SET');
    console.log('OPENAI_API_KEY:', openAIKey ? '✅ SET' : '❌ NOT SET');
    console.log('ANTHROPIC_API_KEY:', anthropicApiKey ? '✅ SET' : '❌ NOT SET');

    // Determine the primary MCP URL (prefer CLIENT_BASE_URL over SERVER_URL)
    const primaryMcpUrl = mcpClientBaseUrl || mcpServerURL;
    
    // Check for required credentials
    const missingCredentials = [];
    if (!primaryMcpUrl) {
      missingCredentials.push('MCP_CLIENT_BASE_URL or MCP_SERVER_URL');
    }
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

    // Validate the MCP URL format
    if (primaryMcpUrl && (!primaryMcpUrl.startsWith('http://') && !primaryMcpUrl.startsWith('https://'))) {
      console.error('❌ Invalid MCP URL format:', primaryMcpUrl);
      return new Response(JSON.stringify({ 
        error: 'Invalid MCP URL format',
        details: 'URL must start with http:// or https://',
        received: primaryMcpUrl,
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Successfully validated all required credentials');
    console.log('🎯 Using primary MCP URL:', primaryMcpUrl);

    // Return unified credentials in a format that supports both legacy and new clients
    const credentials = {
      // Primary fields (new format)
      mcpClientBaseUrl: primaryMcpUrl,
      mcpApiKey,
      openAIKey,
      anthropicApiKey: anthropicApiKey || null,
      
      // Legacy fields for backward compatibility
      mcpServerURL: primaryMcpUrl,
      
      // Additional metadata
      success: true,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      source: mcpClientBaseUrl ? 'MCP_CLIENT_BASE_URL' : 'MCP_SERVER_URL'
    };

    console.log('📤 Returning unified credentials to client');
    
    return new Response(JSON.stringify(credentials), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error retrieving MCP credentials:', error);
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

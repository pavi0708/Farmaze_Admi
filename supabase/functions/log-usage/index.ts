// @ts-ignore - Deno runtime will resolve this
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, session_id, tokens_used, model, function_name, request_type } = await req.json();
    
    // Log to console (visible in Supabase logs)
    console.log('🔢 Chat Usage:', {
      user_id,
      session_id,
      tokens_used,
      model,
      function_name,
      request_type,
      timestamp: new Date().toISOString(),
      cost_estimate: (tokens_used * 0.00015 / 1000).toFixed(6)
    });

    // Optional: Send to external logging service (e.g., LogTail, DataDog, etc.)
    // await fetch('https://your-logging-service.com/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ user_id, tokens_used, model, timestamp: new Date() })
    // });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Usage logging error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

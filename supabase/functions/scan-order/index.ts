import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Scan order function called');

    // Get credentials from get-client-credentials function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const credentialsResponse = await supabase.functions.invoke('get-client-credentials');
    
    if (credentialsResponse.error) {
      console.error('Error getting credentials:', credentialsResponse.error);
      throw new Error('Failed to get API credentials');
    }

    const { openAIKey } = credentialsResponse.data;
    
    if (!openAIKey) {
      throw new Error('OpenAI API key not found');
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    console.log('Processing image with OpenAI Vision API');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at reading handwritten or scanned order sheets and converting them into structured JSON.

CRITICAL RULES:
1. A dash or horizontal line (e.g., "—", "-", "——") in the Qty column means **NO ORDER**. → Skip that product and record it in "skipped".
2. Include ONLY rows with a clear numeric quantity and a supported unit.
3. NEVER guess or estimate quantities. If unclear or illegible → skip with reason.
4. Preserve the exact unit as written in the sheet in "original_unit".
5. Normalize the unit to one of the allowed enums for "unit".

OUTPUT SCHEMA (return only JSON, nothing else):
{
  "weight_based": [
    { "name": "string", "quantity": number, "unit": "kg" | "g", "original_unit": "string" }
  ],
  "count_based": [
    { "name": "string", "quantity": number, "unit": "pkt" | "box" | "gaadi" | "stm" | "nos" | "bunch" | "pcs", "original_unit": "string" }
  ],
  "skipped": [
    { "name": "string", "reason": "dash/no-qty" | "illegible" | "unit-unsupported" }
  ]
}

NORMALIZATION RULES:
- "kg", "kgs", "Kg", "KG" → unit = "kg"
- "g", "gm", "gms", "grams" → unit = "g"
- "pkt", "pack", "packet" → unit = "pkt"
- "box", "boxes" → unit = "box"
- "gaadi", "gaadis" → unit = "gaadi"
- "stm", "stem", "stems" → unit = "stm"
- "nos", "no", "pcs", "piece", "pieces" → unit = "pcs"
- "bunch", "bunches" → unit = "bunch"

VALIDATION:
- "quantity" must be a positive number.
- For count-based units (pcs, pkt, box, stm, gaadi, bunch), quantity must be an integer.
- If unit not in the whitelist, skip with reason="unit-unsupported".
- If any doubt whether a mark is a dash or the digit "1", default to dash → skip with reason="dash/no-qty".

TABLE LAYOUT HINT:
- The sheet may have two parallel columns (left and right). Read both fully.

Return ONLY the JSON object following the schema above.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all products and quantities from this order list image.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.1
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorText}`);
    }

    const openAIResult = await openAIResponse.json();
    console.log('OpenAI response:', openAIResult);

    const extractedText = openAIResult.choices[0].message.content;
    console.log('Extracted text:', extractedText);

    // Parse the JSON response from OpenAI
    let productsData;
    try {
      // Clean the response in case OpenAI adds any extra text
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : extractedText;
      productsData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse extracted products');
    }

    // Combine both sections into a single array for backwards compatibility
    const products = [
      ...(productsData.weight_based || []),
      ...(productsData.count_based || [])
    ];

    console.log('Successfully extracted products:', products);
    console.log('Skipped items:', productsData.skipped || []);

    return new Response(JSON.stringify({ 
      success: true,
      products: products,
      weight_based: productsData.weight_based || [],
      count_based: productsData.count_based || [],
      skipped: productsData.skipped || [],
      message: `Successfully extracted ${products.length} products from the order list${productsData.skipped?.length ? ` (${productsData.skipped.length} items skipped)` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scan-order function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
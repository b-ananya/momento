import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thought, hasPhoto } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating tags for:', thought);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a memory classification assistant. Generate 2-4 relevant tags for a memory based on the thought and whether it has a photo. Tags should be short (1-2 words), lowercase, and describe emotions, activities, people, places, or themes. Return ONLY a JSON array of strings, nothing else.'
          },
          {
            role: 'user',
            content: `Memory: "${thought}"\nHas photo: ${hasPhoto ? 'yes' : 'no'}\n\nGenerate tags as a JSON array.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', response.status, error);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);

    // Parse the JSON array from the response
    let tags;
    try {
      tags = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse tags, using fallback');
      tags = ['memory'];
    }

    return new Response(JSON.stringify({ tags }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-tags:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

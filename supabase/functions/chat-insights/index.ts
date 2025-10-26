import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Create Supabase client to fetch user's memories
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get the user's memories for context
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('thought, tags, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
    }

    // Build context from memories
    const memoryContext = memories && memories.length > 0
      ? `\n\nUser's recent memories:\n${memories.map((m: any) => 
          `- ${new Date(m.created_at).toLocaleDateString()}: ${m.thought} [Tags: ${m.tags?.join(', ') || 'none'}]`
        ).join('\n')}`
      : '';

    console.log('Chat request with', messages.length, 'messages');

    // Convert OpenAI-style messages to Anthropic format
    const systemPrompt = `You are a thoughtful, empathetic memory companion. You help users reflect on their memories, emotions, and personal growth. You have access to their memory scrapbook and can provide insights, identify patterns, and offer gentle guidance.

Be warm, nostalgic, and supportive. Use their actual memories to give personalized insights. Help them see connections between memories, track emotional patterns, and celebrate their journey.${memoryContext}`;

    const anthropicMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
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

    // Return the streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error: any) {
    console.error('Error in chat-insights:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatRequest {
  message: string;
  courseId?: string;
  context?: {
    currentLesson?: string;
    studentProgress?: number;
    learningStyle?: string;
    previousMessages?: ChatMessage[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the user from the request
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { message, courseId, context }: ChatRequest = await req.json();

    // Get Google Gemini API key from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Fetch course context if courseId is provided
    let courseContext = "";
    if (courseId) {
      const { data: course } = await supabaseClient
        .from('courses')
        .select('title, description, category, level')
        .eq('id', courseId)
        .single();

      if (course) {
        courseContext = `Course: ${course.title} (${course.category}, ${course.level} level)\nDescription: ${course.description}\n\n`;
      }
    }

    // Build conversation history
    let conversationHistory = "";
    if (context?.previousMessages) {
      conversationHistory = context.previousMessages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
    }

    // Create system prompt for educational context
    const systemPrompt = `You are an AI learning assistant for an online education platform. Your role is to help students learn effectively by:

1. Answering questions about course content clearly and accurately
2. Providing explanations at the appropriate level for the student
3. Encouraging critical thinking with follow-up questions
4. Offering study tips and learning strategies
5. Being supportive and motivating

Context:
${courseContext}
${context?.currentLesson ? `Current Lesson: ${context.currentLesson}\n` : ''}
${context?.studentProgress ? `Student Progress: ${context.studentProgress}%\n` : ''}
${context?.learningStyle ? `Learning Style: ${context.learningStyle}\n` : ''}

Guidelines:
- Keep responses concise but comprehensive
- Use examples and analogies when helpful
- Adapt your explanation style to the student's level
- If you don't know something, say so and suggest how they might find the answer
- Always be encouraging and supportive
- Focus on helping the student understand concepts, not just providing answers

Previous conversation:
${conversationHistory}

Student's question: ${message}`;

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    // Store the conversation in the database for future context
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        course_id: courseId,
        user_message: message,
        ai_response: aiResponse,
        context: context || {}
      });

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in AI assistant:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallbackResponse: "I'm sorry, I'm having trouble responding right now. Please try asking your question again, or contact your instructor for help."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
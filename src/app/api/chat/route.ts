import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const signal = req.signal;
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const imageUrl = formData.get('image_url') as string | null;
    const messagesStr = formData.get('messages') as string;
    const previousMessages = messagesStr ? JSON.parse(messagesStr) : [];

    // Validate required fields
    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemMessage = {
      role: "system",
      content: [
        { 
          type: "text", 
          text: "You are a knowledgeable home repair assistant. Provide clear, step-by-step guidance for home repair issues, always prioritizing safety and proper techniques. If a repair seems too complex or dangerous, recommend professional help."
        }
      ]
    };

    let userMessage;
    if (imageUrl) {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: message },
          { 
            type: "image_url", 
            image_url: { 
              url: imageUrl.startsWith('data:') ? imageUrl : `data:image/jpeg;base64,${imageUrl}`
            } 
          }
        ]
      };
    } else {
      userMessage = {
        role: "user",
        content: [{ type: "text", text: message }]
      };
    }

    // Convert previous messages to the new format
    const formattedPreviousMessages = previousMessages.map((msg: any) => ({
      role: msg.role,
      content: [{ type: "text", text: msg.content }]
    }));

    const messages = [systemMessage, ...formattedPreviousMessages, userMessage];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }, { signal });

    return new NextResponse(
      JSON.stringify({ response: completion.choices[0].message.content }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    
    // Handle abort error
    if (error.name === 'AbortError') {
      return new NextResponse(
        JSON.stringify({ error: 'Request cancelled by user' }),
        { status: 499, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
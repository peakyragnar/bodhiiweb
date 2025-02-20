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
    const file = formData.get('file') as File | null;
    const messagesStr = formData.get('messages') as string;
    const previousMessages = messagesStr ? JSON.parse(messagesStr) : [];

    // Validate required fields
    if (!message && !file) {
      return new NextResponse(
        JSON.stringify({ error: 'Message or file is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let imageDescription = '';
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable home repair assistant. When analyzing images, focus on identifying any visible damage, maintenance issues, or areas that need attention."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What do you see in this image related to home repair? Please describe any visible issues or damage."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${buffer.toString('base64')}`,
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      }, { signal });
      imageDescription = response.choices[0].message.content || '';
    }

    const systemMessage = {
      role: "system",
      content: "You are a knowledgeable home repair assistant. Provide clear, step-by-step guidance for home repair issues, always prioritizing safety and proper techniques. If a repair seems too complex or dangerous, recommend professional help."
    };

    const userMessage = {
      role: "user",
      content: imageDescription ? `${message}\n\nImage Analysis: ${imageDescription}` : message
    };

    const messages = [systemMessage, ...previousMessages, userMessage];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 500,
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
    
    // Handle specific OpenAI API errors
    if (error?.code === 'invalid_api_key') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid OpenAI API key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle rate limiting
    if (error?.status === 429) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle model deprecation
    if (error?.code === 'model_not_found') {
      return new NextResponse(
        JSON.stringify({ error: 'The model is currently unavailable. Please try again later.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
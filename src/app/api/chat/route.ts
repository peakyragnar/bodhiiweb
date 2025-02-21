import OpenAI from "openai";
import { NextResponse } from "next/server";

// Validate OpenAI API key during initialization
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const signal = req.signal;
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const imageUrl = formData.get("image_url") as string | null;
    const messagesStr = formData.get("messages") as string;
    const previousMessages = messagesStr ? JSON.parse(messagesStr) : [];

    // Validate required fields
    if (!message && !imageUrl) {
      return new NextResponse(
        JSON.stringify({ error: "Message or image_url is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // System message for home repair assistant
    const systemMessage = {
      role: "system",
      content: [
        {
          type: "text",
          text: "You are a knowledgeable home repair assistant. Provide clear, step-by-step guidance for home repair issues based on text input and image analysis. Always prioritize safety and proper techniques. If a repair seems too complex or dangerous, recommend professional help.",
        },
      ],
    };

    // User message construction
    const userContent = [];
    if (message) {
      userContent.push({ type: "text", text: message });
    }
    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    }

    const userMessage = {
      role: "user",
      content: userContent,
    };

    // Combine messages
    const messages = [systemMessage, ...previousMessages, userMessage];

    // Call OpenAI API with sandbox-inspired settings
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4-turbo", // Ensure this is a vision-capable model
        messages,
        temperature: 0.7, // Balanced creativity and coherence
        max_tokens: 2048, // Increased for detailed image descriptions
        top_p: 1, // Default sandbox value
        frequency_penalty: 0, // Default sandbox value
        presence_penalty: 0, // Default sandbox value
        response_format: { type: "text" }, // Ensure text output
      },
      { signal }
    );

    return new NextResponse(
      JSON.stringify({ response: completion.choices[0].message.content }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);

    // Handle abort error
    if (error.name === "AbortError") {
      return new NextResponse(
        JSON.stringify({ error: "Request cancelled by user" }),
        { status: 499, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle OpenAI-specific errors
    if (error.response) {
      console.error("OpenAI API error:", error.response.data);
      return new NextResponse(
        JSON.stringify({ error: error.response.data.message || "OpenAI API error" }),
        { status: error.response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
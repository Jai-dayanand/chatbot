import { NextResponse } from "next/server";
import OpenAI from "openai";

// System prompt to guide the assistant
const systemPrompt = `
Welcome to AI Headstarter Support! I am your virtual assistant, here to help you with any questions or issues related to our platform. AI Headstarter is a cutting-edge platform that offers AI-powered interviews designed to help software engineering candidates prepare for their dream jobs.

1. Guide users on how to sign up, log in, schedule interviews, and use various features of the AI Headstarter platform.
2. Technical Support: Assist with troubleshooting common technical issues such as login problems, video interview setup, and browser compatibility.
3. Interview Preparation: Provide tips and resources for candidates to help them prepare for AI-powered interviews.
4. Account Assistance: Help users with account-related queries, including password resets, account updates, and subscription management.
5. General Inquiries: Answer questions about AI Headstarter’s services, pricing, and how AI-powered interviews work.
`;

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const data = await req.json();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...data,
      ],
      model: "gpt-3.5-turbo", // Ensure the model name is correct
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Error handling the request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { content, task } = await request.json();

  if (!content || !task) {
    return NextResponse.json({ error: 'Content and task are required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
  }

  try {
    const fullPrompt = `<task>
${task}
</task>

<content>
${content}
</content>`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      messages: [
        { role: "user", content: fullPrompt }
      ]
    });

    return NextResponse.json({
      result: (message.content[0] as { type: 'text'; text: string }).text
    });
  } catch (error: unknown) {
    console.error('Anthropic API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

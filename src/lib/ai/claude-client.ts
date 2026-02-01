import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic SDK
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Helper function to ask Claude a question with optional system prompt
 * @param prompt User prompt/question
 * @param systemPrompt Optional system instructions
 * @param maxTokens Maximum tokens for response (default: 4096)
 * @returns Claude's response as text
 */
export async function askClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 4096
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    temperature: 0.3, // Lower temperature for more consistent JSON formatting
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text from content blocks
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textContent.text;
}

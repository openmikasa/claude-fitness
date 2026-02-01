/**
 * Robust JSON extraction utility for AI responses
 * Handles mixed content, markdown fences, and edge cases
 */

export interface JsonExtractionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  rawResponse?: string;
  extractionMethod?: string;
}

export function extractJson(
  response: string,
  logErrors = true
): JsonExtractionResult {
  const trimmed = response.trim();

  // Strategy 1: Direct parse (pure JSON)
  try {
    const data = JSON.parse(trimmed);
    return { success: true, data, extractionMethod: 'direct' };
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Remove markdown code fences
  const markdownMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (markdownMatch) {
    try {
      const data = JSON.parse(markdownMatch[1].trim());
      return { success: true, data, extractionMethod: 'markdown_fence' };
    } catch (parseError) {
      if (logErrors) {
        console.error('Failed to parse JSON inside markdown fence:', parseError);
      }
    }
  }

  // Strategy 3: Find JSON object boundaries (handles text before/after)
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const data = JSON.parse(jsonCandidate);
      return { success: true, data, extractionMethod: 'boundary_extraction' };
    } catch (parseError) {
      if (logErrors) {
        console.error('Failed to parse extracted JSON boundaries:', parseError);
      }
    }
  }

  // Strategy 4: Search for any code blocks with JSON
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;
  const matches = Array.from(trimmed.matchAll(codeBlockRegex));

  for (const match of matches) {
    try {
      const data = JSON.parse(match[1].trim());
      return { success: true, data, extractionMethod: 'markdown_search' };
    } catch {
      // Try next match
    }
  }

  // All strategies failed
  return {
    success: false,
    error: 'Could not extract valid JSON from response',
    rawResponse: logErrors ? response : undefined,
  };
}

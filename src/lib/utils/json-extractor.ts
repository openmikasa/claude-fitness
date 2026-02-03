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

/**
 * Attempts to repair common JSON formatting issues
 * Focuses on fixing unescaped characters in string values
 *
 * Uses a state machine to track if we're inside a string,
 * then escapes unescaped newlines, tabs, and carriage returns.
 */
function repairJson(jsonString: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    // Track if we're inside a string
    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    }
    // Escape character
    else if (char === '\\' && !escaped) {
      escaped = true;
      result += char;
    }
    // Newline inside string - escape it
    else if ((char === '\n' || char === '\r') && inString) {
      result += char === '\n' ? '\\n' : '\\r';
    }
    // Tab inside string - escape it
    else if (char === '\t' && inString) {
      result += '\\t';
    }
    // Regular character
    else {
      result += char;
      escaped = false;
    }
  }

  return result;
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
    // Try with repair
    try {
      const repaired = repairJson(trimmed);
      const data = JSON.parse(repaired);
      if (logErrors) {
        console.log('JSON repaired successfully in direct parse');
      }
      return { success: true, data, extractionMethod: 'direct_repaired' };
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Remove markdown code fences
  const markdownMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (markdownMatch) {
    try {
      const data = JSON.parse(markdownMatch[1].trim());
      return { success: true, data, extractionMethod: 'markdown_fence' };
    } catch (parseError) {
      // Try with repair
      try {
        const repaired = repairJson(markdownMatch[1].trim());
        const data = JSON.parse(repaired);
        if (logErrors) {
          console.log('JSON repaired successfully in markdown fence parse');
        }
        return { success: true, data, extractionMethod: 'markdown_fence_repaired' };
      } catch {
        if (logErrors) {
          console.error('Failed to parse JSON inside markdown fence:', parseError);
        }
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
      // Try with repair - CRITICAL for large program responses
      try {
        const repaired = repairJson(jsonCandidate);
        const data = JSON.parse(repaired);
        if (logErrors) {
          console.log('JSON repaired successfully in boundary extraction');
        }
        return { success: true, data, extractionMethod: 'boundary_extraction_repaired' };
      } catch (repairError) {
        if (logErrors) {
          // Enhanced error logging with context
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          const errorPos = errorMessage.match(/position (\d+)/);
          if (errorPos) {
            const pos = parseInt(errorPos[1]);
            const start = Math.max(0, pos - 200);
            const end = Math.min(jsonCandidate.length, pos + 200);
            console.error('JSON parse error at position', pos);
            console.error('Context:', jsonCandidate.substring(start, end));
            console.error('Character at error:', JSON.stringify(jsonCandidate[pos]));
          }
          console.error('Failed to parse extracted JSON boundaries:', parseError);
        }
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
      // Try with repair
      try {
        const repaired = repairJson(match[1].trim());
        const data = JSON.parse(repaired);
        if (logErrors) {
          console.log('JSON repaired successfully in markdown search');
        }
        return { success: true, data, extractionMethod: 'markdown_search_repaired' };
      } catch {
        // Try next match
      }
    }
  }

  // Strategy 5: Aggressive cleanup - find last valid closing brace
  // Handles cases where Claude adds explanatory text after the JSON
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/, '') // Remove opening fence
    .replace(/\n?```$/, ''); // Remove closing fence

  let jsonCandidate = stripped.trim();

  // Try progressive truncation from the end to find last complete }
  for (let i = jsonCandidate.length - 1; i >= 0; i--) {
    if (jsonCandidate[i] === '}') {
      const candidate = jsonCandidate.substring(0, i + 1);
      try {
        const data = JSON.parse(candidate);
        if (logErrors) {
          console.log('Aggressive cleanup: truncated response from', jsonCandidate.length, 'to', candidate.length, 'chars');
        }
        return { success: true, data, extractionMethod: 'aggressive_cleanup' };
      } catch {
        // Try with repair
        try {
          const repaired = repairJson(candidate);
          const data = JSON.parse(repaired);
          if (logErrors) {
            console.log('Aggressive cleanup with repair: truncated response from', jsonCandidate.length, 'to', candidate.length, 'chars');
          }
          return { success: true, data, extractionMethod: 'aggressive_cleanup_repaired' };
        } catch {
          // Try next } from the end
        }
      }
    }
  }

  // All strategies failed
  return {
    success: false,
    error: 'Could not extract valid JSON from response',
    rawResponse: logErrors ? response : undefined,
  };
}

# Fix AI Program Generation JSON Parsing Error - Implementation Summary

## Changes Implemented

### 1. JSON Repair Function (`src/lib/utils/json-extractor.ts`)

Added `repairJson()` function that uses a state machine to:
- Track when parser is inside a JSON string value
- Escape unescaped newlines (`\n`), carriage returns (`\r`), and tabs (`\t`)
- Avoid double-escaping already-escaped characters
- Preserve all other JSON structure

**Lines**: 14-55

### 2. Integrated Repair into All 5 Extraction Strategies

Each strategy now attempts JSON repair on parse failure:

#### Strategy 1: Direct Parse (lines 63-79)
- Tries `JSON.parse(trimmed)` first
- On failure, tries `repairJson(trimmed)` then parses
- Returns `extractionMethod: 'direct_repaired'` when repair used

#### Strategy 2: Markdown Fence (lines 81-102)
- Extracts content from ```json fences
- Tries parse, then repair on failure
- Returns `extractionMethod: 'markdown_fence_repaired'` when repair used

#### Strategy 3: Boundary Extraction (lines 104-139) ⭐ CRITICAL
- Extracts JSON between first `{` and last `}`
- **This is where the original error occurred**
- Now tries repair on parse failure
- **Enhanced error logging** with context around error position
- Returns `extractionMethod: 'boundary_extraction_repaired'` when repair used

#### Strategy 4: Markdown Search (lines 141-162)
- Searches for all code blocks
- Tries each, with repair fallback
- Returns `extractionMethod: 'markdown_search_repaired'` when repair used

#### Strategy 5: Aggressive Cleanup (lines 164-196)
- Progressive truncation from end
- Now tries repair at each truncation point
- Returns `extractionMethod: 'aggressive_cleanup_repaired'` when repair used

### 3. Enhanced Error Logging (lines 124-136)

Strategy 3 now logs:
- Error position in JSON string
- 200 characters of context before/after error
- The exact character causing the error

This helps diagnose any repair failures in production.

### 4. Updated AI Prompts (`.claude/skills/fitness-coach/SKILL.md`)

Added new section: "JSON Formatting Requirements" (lines 353-376)

Explicitly instructs Claude to:
- **ALWAYS escape newlines** as `\n` not actual line breaks
- **ALWAYS escape quotes** with `\"`
- **ALWAYS escape backslashes** as `\\`
- **ALWAYS escape tabs** as `\t`
- **NEVER use actual newlines** in string values

Includes correct and incorrect examples with clear warnings.

### 5. Verification Script

Created `scripts/test-json-repair.js` for manual testing.

**All 6 test cases pass:**
- ✅ Unescaped newlines
- ✅ Multiple fields with newlines
- ✅ No double-escaping of already-escaped content
- ✅ Mixed escaped and unescaped content
- ✅ Large program-like JSON
- ✅ Empty strings

## How It Fixes the Original Error

### Original Error
```
Failed to parse extracted JSON boundaries: SyntaxError: Expected ',' or '}'
after property value in JSON at position 24092 (line 749 column 8)
```

**Root Cause**: Claude generated coaching_notes with actual newlines instead of `\n`.

### How Repair Fixes It

1. **Request comes in** for weekly program generation
2. **Claude generates response** (may contain unescaped newlines)
3. **Strategy 3 extracts** JSON between `{` and `}`
4. **First parse attempt fails** (same as before)
5. **NEW: Repair function runs**
   - Scans through JSON string
   - Detects we're inside `"coaching_notes": "..."`
   - Finds actual newline character
   - Replaces with `\\n`
   - Returns repaired JSON
6. **Second parse succeeds** ✅
7. **Returns** `{ success: true, data: {...}, extractionMethod: 'boundary_extraction_repaired' }`

### Production Monitoring

After deployment, check Vercel logs for:
- `"JSON repaired successfully in boundary extraction"` - indicates repair worked
- `extractionMethod: 'boundary_extraction_repaired'` - shows which strategy succeeded
- Enhanced error logs if repair still fails (unlikely)

## Files Modified

1. `src/lib/utils/json-extractor.ts` - Core repair logic + integration
2. `.claude/skills/fitness-coach/SKILL.md` - AI prompt improvements
3. `scripts/test-json-repair.js` - Verification tests (new file)

## Rollback Plan

If issues arise:

```typescript
// Add to top of json-extractor.ts
const ENABLE_JSON_REPAIR = false;

// Wrap all repair attempts
if (ENABLE_JSON_REPAIR) {
  try {
    const repaired = repairJson(jsonCandidate);
    // ...
  } catch { }
}
```

Or revert commits:
```bash
git log --oneline  # Find commit hash
git revert <hash>  # Revert changes
```

## Success Metrics

Track these after deployment:

1. **Zero parsing errors** for weekly program generation
2. **Extraction method stats** in logs:
   - How often `*_repaired` methods are used
   - Which strategies are most common
3. **User success rate** for multi-week program generation
4. **No user reports** of generation failures

## Next Steps

1. ✅ Changes implemented and tested
2. ⏭️ Deploy to production
3. ⏭️ Monitor Vercel logs for repair usage
4. ⏭️ Track user feedback on program generation
5. ⏭️ Consider adding metrics/analytics for extraction method usage

## Alternative Improvements (Future)

If issues persist or for further optimization:

1. **JSON Schema Validation**: Use Zod schema to validate before returning
2. **Streaming Validation**: Validate JSON as it streams from Claude API
3. **JSON Repair Library**: Use `jsonrepair` npm package for more robust repair
4. **Token Budget Management**: Reduce coaching_notes length when near limits
5. **Retry Logic**: Retry API call with modified prompt if repair fails

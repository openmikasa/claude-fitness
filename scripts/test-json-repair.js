/**
 * Manual verification script for JSON repair functionality
 * Run with: node scripts/test-json-repair.js
 */

// Inline copy of repairJson for testing
function repairJson(jsonString) {
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

console.log('Testing JSON repair function...\n');

// Test 1: Unescaped newlines
console.log('Test 1: Unescaped newlines');
const test1 = `{"coaching_notes": "Week 1 Day 1.
Focus on form.
Rest 90 seconds."}`;

const repaired1 = repairJson(test1);
try {
  const parsed1 = JSON.parse(repaired1);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Result:', parsed1.coaching_notes);
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

// Test 2: Multiple fields with newlines
console.log('Test 2: Multiple fields with newlines');
const test2 = `{
  "coaching_notes": "PULL - DELOAD WEEK
Reduced volume to 50%
Focus on scapular control",
  "rationale": "Deload week is essential
Allows for recovery"
}`;

const repaired2 = repairJson(test2);
try {
  const parsed2 = JSON.parse(repaired2);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Coaching notes:', parsed2.coaching_notes);
  console.log('   Rationale:', parsed2.rationale);
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

// Test 3: Already escaped newlines (should not double-escape)
console.log('Test 3: Already escaped newlines');
const test3 = '{"coaching_notes": "Already escaped\\nShould stay single escaped"}';

const repaired3 = repairJson(test3);
try {
  const parsed3 = JSON.parse(repaired3);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Result:', parsed3.coaching_notes);
  // Verify single escape
  if (parsed3.coaching_notes === 'Already escaped\nShould stay single escaped') {
    console.log('   ✅ No double-escaping detected');
  } else {
    console.log('   ❌ Double-escaping detected');
  }
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

// Test 4: Mixed escaped and unescaped
console.log('Test 4: Mixed escaped and unescaped');
const test4 = `{"coaching_notes": "Already escaped\\nBut this is not
Mixed content"}`;

const repaired4 = repairJson(test4);
try {
  const parsed4 = JSON.parse(repaired4);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Result:', parsed4.coaching_notes);
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

// Test 5: Large realistic program JSON
console.log('Test 5: Large program-like JSON');
const test5 = `{
  "program_name": "12-Week Hypertrophy Program",
  "weeks": [
    {
      "week_number": 1,
      "days": [
        {
          "day_name": "Monday - Push",
          "coaching_notes": "Week 1 - Building base
Focus on eccentric control
Rest 90-120 seconds between sets
Track your RPE for each set"
        }
      ]
    }
  ]
}`;

const repaired5 = repairJson(test5);
try {
  const parsed5 = JSON.parse(repaired5);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Program name:', parsed5.program_name);
  console.log('   First day coaching notes:', parsed5.weeks[0].days[0].coaching_notes);
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

// Test 6: Empty strings
console.log('Test 6: Empty strings');
const test6 = '{"coaching_notes": ""}';

const repaired6 = repairJson(test6);
try {
  const parsed6 = JSON.parse(repaired6);
  console.log('✅ PASS - Parsed successfully');
  console.log('   Result:', JSON.stringify(parsed6));
} catch (e) {
  console.log('❌ FAIL -', e.message);
}
console.log();

console.log('All tests completed!');

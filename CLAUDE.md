# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🤖 Project Instructions: Claude Fitness

## 🎯 Project Overview
* **Purpose:** Fitness tracking and workout planning application
* **Tech Stack:** TBD
* **Architecture:** TBD

---

## 🛠️ Mandatory Tooling (MCP)

### 1. Context7 (Documentation Skill)
* **Protocol:** Before implementing any logic involving external APIs or libraries, use the `context7` tool to fetch the most recent documentation.
* **Instruction:** Do not rely on internal knowledge for libraries like **Tailwind**, **Prisma**, or **Clerk**. Always verify syntax via `context7` to ensure we are using this year standards.

### 2. Playwright (Verification Skill)
* **Protocol:** Once a UI component or a user flow (login, checkout, etc.) is modified, use the `playwright` MCP server to verify the changes.
* **Instruction:**
    1. Run a headless browser check to ensure the page renders without 500 errors.
    2. Confirm that critical buttons are "clickable" and visible.
    3. If a visual bug is suspected, take a screenshot and analyze the layout.
    4. **Test changes when relevant or needed** - Start the dev server, verify affected pages work correctly, then close the browser and stop the server. Don't ask the user if you should test; use your judgment on when testing is necessary.

---

## 📜 Coding Standards

### Think Before Coding
* **Don't assume. Don't hide confusion. Surface tradeoffs.**
* Before implementing:
  - State your assumptions explicitly. If uncertain, ask.
  - If multiple interpretations exist, present them - don't pick silently.
  - If a simpler approach exists, say so. Push back when warranted.
  - If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First
* **Minimum code that solves the problem. Nothing speculative.**
* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.
* Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes
* **Touch only what you must. Clean up only your own mess.**
* When editing existing code:
  - Don't "improve" adjacent code, comments, or formatting.
  - Don't refactor things that aren't broken.
  - Match existing style, even if you'd do it differently.
  - If you notice unrelated dead code, mention it - don't delete it.
* When your changes create orphans:
  - Remove imports/variables/functions that YOUR changes made unused.
  - Don't remove pre-existing dead code unless asked.
* The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution
* **Define success criteria. Loop until verified.**
* Transform tasks into verifiable goals:
  - "Add validation" → "Write tests for invalid inputs, then make them pass"
  - "Fix the bug" → "Write a test that reproduces it, then make it pass"
  - "Refactor X" → "Ensure tests pass before and after"
* For multi-step tasks, state a brief plan:
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  3. [Step] → verify: [check]
* Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### General Standards
* **TypeScript:** Strict mode enabled. No `any` types allowed. Define interfaces for all API responses.
* **Components:** Use small, functional, atomic components.
* **Naming:** Use `kebab-case` for file names and `PascalCase` for React components.
* **Error Handling:** Use try/catch blocks with meaningful error messages and UI feedback.

---

## 📁 File Structure Guidelines
* `CLAUDE.md`: This file (Project source of truth)

---

## ⚠️ Lessons Learned & Constraints
* *(Add recurring issues here to prevent Claude from making the same mistake twice)*

---

## 🔄 Updating Progress
When a task is completed, evaluate if any new "permanent" knowledge was gained.
Update `CLAUDE.md` if:
1. We solved a recurring bug specific to this codebase.
2. We established a new architectural pattern (e.g., "Use X for state management").
3. You learned a preference I have (e.g., "Never use semicolons," "Always use functional components").
4. A library version change requires a different syntax than your training data.

**Process:**
- Propose the change first: "I've noticed we do [X] frequently. Should I add this to CLAUDE.md?"
- Use a structured format: `[Category] Description | Rationale`.
- If you want to update CLAUDE.md: Make sure your change is not redundant and whether the file instructions can be compressed without any loss of information or instructions. You will do this check only based on the new information you want to add, so you don't review the same things multiple times.

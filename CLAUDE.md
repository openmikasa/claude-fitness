# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🤖 Project Instructions: Claude Fitness

## 🎯 Project Overview
* **Purpose:** AI-powered weightlifting tracker and workout programming application
* **Production URL:** https://winter-arc.vercel.app/
* **Repository:** https://github.com/openmikasa/claude-fitness
* **Deployment:** Vercel with auto-deploy from `main` branch (deploys in ~2 minutes)
* **Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Auth), Claude API, React Query, Tailwind CSS
* **Architecture:**
  - Server-side API routes with Supabase RLS for security
  - React Query for data fetching/caching with optimistic updates
  - Dual-write pattern: JSONB + normalized tables for backward compatibility
  - Offline-first with queue sync for settings
  - Progressive Web App (PWA) for mobile installation

---

## 🛠️ Mandatory Tooling (MCP)

### 1. Context7 (Documentation Skill)
* **Protocol:** Before implementing any logic involving external APIs or libraries, use the `context7` tool to fetch the most recent documentation.
* **Key Libraries to Always Check:**
  - **Supabase** - Auth, database queries, RLS policies
  - **React Query (@tanstack/react-query)** - Caching, mutations, query keys
  - **Tailwind CSS** - Utility classes, responsive design
  - **React Hook Form** - Form handling, validation
  - **Zod** - Schema validation
  - **Next.js 14** - App Router, API routes, server components
* **Instruction:** Do not rely on internal knowledge for these libraries. Always verify syntax via `context7` to ensure we are using current standards.

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

### Key Directories
* `src/app/` - Next.js App Router pages and API routes
* `src/components/` - React components (auth, workout, ui, ai, import)
* `src/lib/hooks/` - React Query hooks (useWorkouts, useSettings, useAuth)
* `src/lib/supabase/` - Supabase client configurations
* `src/lib/utils/` - Utility functions (workout-helpers for backward compat, unit-conversion for kg/lb)
* `src/types/` - TypeScript interfaces (workout, auth, program)
* `supabase/migrations/` - Database schema migrations (run in order)

### Naming Conventions
* Files: `kebab-case.tsx` (e.g., `workout-list.tsx`)
* Components: `PascalCase` (e.g., `WorkoutList`)
* Hooks: `use` prefix (e.g., `useWorkouts`)
* API routes: `route.ts` in folder structure (e.g., `api/workouts/route.ts`)

### Component Organization
* `components/ui/` - Generic reusable components (MultiSelect, Autocomplete)
* `components/workout/` - Workout-specific components
* `components/auth/` - Authentication forms
* Each component should be self-contained with its own file

---

## ⚠️ Lessons Learned & Constraints

### Data Architecture Patterns
* **[Database] Dual-Write Pattern** | When adding normalized tables, maintain backward compatibility by writing to both JSONB and junction tables. Use helper functions (`workout-helpers.ts`) to read from either source.
* **[Database] GIN Indexes Required** | Always add GIN indexes for array columns (equipment, muscle_groups) to enable fast containment queries. Critical for filter performance.
* **[Database] RLS Policies** | Every new table needs RLS enabled + policies for SELECT/INSERT/UPDATE/DELETE. Policy pattern: check ownership via user_id or join to user-owned table.

### React Query Patterns
* **[State] Optimistic Updates** | All mutations should use onMutate for optimistic UI updates with rollback on error. See `useUpdateSettings` for pattern.
* **[State] Query Keys** | Use structured query keys with filters: `workoutKeys.list(filters)` not just `['workouts']`. Enables precise cache invalidation.
* **[State] Offline Queue** | Settings/mutations should queue in localStorage when offline and sync via OfflineQueue when online.

### API Endpoint Patterns
* **[API] Authentication First** | Always call `getAuthenticatedUser()` first, return 401 if no user. Never trust client-side auth state.
* **[API] Zod Validation** | Validate all request bodies with Zod schemas. Return 400 with error details on validation failure.
* **[API] Filtering Logic** | Complex filters (equipment, muscle groups on arrays) require client-side filtering after fetch. Can't use Supabase filters on nested arrays efficiently.

### Component Patterns
* **[UI] Reusable Components** | Multi-selects, autocompletes, and form controls belong in `components/ui/`. Keep them generic with props, not tied to specific domains.
* **[Forms] React Hook Form + Zod** | Use `react-hook-form` with `zodResolver`. Validation schema should match API endpoint schema.
* **[Forms] Autocomplete Integration** | When selecting from autocomplete, auto-populate related fields (e.g., exercise selection fills equipment/muscle groups).
* **[Forms] Unit Conversion** | Always store weights in kg in database. Use `inputToKg()` when saving, `displayWeight()` when showing. Form labels should use `getWeightUnitLabel()` based on user preference.

### Unit Conversion System
* **[Storage] Always Store in KG** | Database always stores weights in kg regardless of user preference. Use `src/lib/utils/unit-conversion.ts` utilities for all conversions.
* **[Display] User Preference** | All weight displays use `displayWeight(weightInKg, userPreference)` to show in metric or imperial based on user settings.
* **[CSV Import] Auto-Detection** | CSV parser detects units from cell values (e.g., "60.0kg", "45lb") or column names. Converts all to kg via `normalizeWeight()`.
* **[Forms] Dynamic Units** | Workout forms show unit labels based on user preference and convert input to kg before saving via `inputToKg()`.
* **[Backward Compat] Optional Unit Field** | `WeightliftingSet.unit` is optional - existing workouts without unit field are assumed to be kg.

### Migration Patterns
* **[Database] IF NOT EXISTS** | Always use `IF NOT EXISTS` in migrations for idempotency. Allows safe re-runs.
* **[Migration] Gradual Rollout** | Use UI wizards (modals) for data migrations instead of forcing immediate migration. Let users migrate at their own pace.
* **[Migration] Backward Compat Helpers** | Create helper functions that work with both old and new data formats. Never break old workouts.

### Testing Requirements
* **[Testing] Playwright for Features** | Major feature additions require Playwright E2E tests covering happy path and key edge cases.
* **[Testing] Manual Verification** | Before production: test offline mode, cross-device sync, filter combinations, and migration flow.

### Common Pitfalls
* **[Imports] Package Name Typos** | Watch for `@tanstack/react-query` not `@tantml/react-query` (common typo).
* **[Auth] Timing Issues** | Don't fetch data before auth completes. Check `!loading && user` not just `user`.
* **[Filters] Empty Arrays** | Filter logic must handle empty arrays as "no filter" not "filter nothing". Check `.length > 0` before applying.
* **[RLS] Policy Testing** | New RLS policies can silently hide data. Always test with non-owner user to verify policies work correctly.
* **[Drag-Drop] Nested Elements** | Use counter pattern for drag-and-drop with nested elements. Increment counter on `dragEnter`, decrement on `dragLeave`, only clear state when counter reaches 0. Prevents flickering when dragging over child elements.

### Security & Secrets Management
* **[Security] Secrets Repository Pattern** | All production credentials live in a separate private repository (`claude-fitness-secrets`). The main repository has NO `.env.local` file checked in or committed. Developers copy `.env.local` from the secrets repo to their local main repo directory. This ensures a clear security boundary and single source of truth for credentials.
* **[Security] .env.local Never Committed** | The `.env.local` file is strictly gitignored and must never be committed to the main repository. Use `.env.example` as a template. Vercel production uses environment variables configured in the dashboard, not .env files.

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

# Development Guide

Quick reference for setting up and developing Claude Fitness.

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-your-key
```

Get your Supabase credentials from [supabase.com](https://supabase.com) → Settings → API

### 3. Set Up Database

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/` directory (in numerical order)
3. Copy your project credentials to `.env.local`

### 4. Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

## Secrets Management

**Source of Truth**: The private `claude-fitness-secrets` repository contains all production credentials.

**Setup Workflow**:
1. Clone the secrets repository: `git clone https://github.com/openmikasa/claude-fitness-secrets.git`
2. Copy credentials: `cp ../claude-fitness-secrets/.env.local .env.local`
3. Verify `.env.local` is gitignored (it should be by default)

**Important**:
- NEVER commit `.env.local` to the main repository
- Keep secrets repo private at all times
- If credentials change, update the secrets repo and notify team members
- Vercel production uses environment variables configured in the dashboard

## Running Tests

```bash
# Install Playwright browsers
npx playwright install

# Run end-to-end tests
npx playwright test

# Run in UI mode
npx playwright test --ui
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality

# Database
supabase start       # Start local Supabase
supabase db reset    # Reset local database
```

## Code Standards

See [CLAUDE.md](CLAUDE.md) for complete coding standards. Key principles:

- **Think before coding** - State assumptions, surface tradeoffs
- **Simplicity first** - Minimum code to solve the problem
- **Surgical changes** - Touch only what you must
- **TypeScript strict mode** - No `any` types
- **Use MCP tools** - Context7 for docs, Playwright for testing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Claude API (Opus 4.5)
- **State**: React Query + React Context
- **Forms**: React Hook Form + Zod validation

## Documentation

- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **Quick Reference**: [docs/quick-reference.md](docs/quick-reference.md)
- **Deployment**: [docs/deployment.md](docs/deployment.md)
- **History**: [docs/archive/](docs/archive/)

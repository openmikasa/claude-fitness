# Claude Fitness

AI-powered weightlifting tracker and workout programming. Track weightlifting workouts, import CSV data, get AI-powered training plans.

## 📚 Documentation Guide

**New to the project?**
1. Start here for setup
2. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guide
3. See [docs/architecture.md](docs/architecture.md) for complete architecture and implementation details

**Resuming development?**
- [docs/quick-reference.md](docs/quick-reference.md) - Quick commands and current status

**Contributing or using AI assistance?**
- [CLAUDE.md](CLAUDE.md) - Mandatory coding standards

**Deploying?**
- [docs/deployment.md](docs/deployment.md) - Vercel deployment guide

**Historical context?**
- [docs/archive/](docs/archive/) - Phase summaries and technical decisions

## Features

- 🏋️ Track weightlifting workouts
- 📊 Filter by equipment, muscle groups, date range
- ⚙️ Settings sync across devices
- 📥 Import CSV workout data (5,000 row limit)
- 🤖 AI-powered workout recommendations (Claude API)
- 📱 PWA support - install as native app
- 🔐 Secure auth with Supabase

## Tech Stack

Next.js 14 • TypeScript • Supabase • Claude AI • React Query • Tailwind CSS

→ See [docs/architecture.md](docs/architecture.md#tech-stack) for complete stack details

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 3. Set Up Database

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/` (in order)
3. Copy credentials to `.env.local`

### 4. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

## Project Status

**All 6 phases complete** ✅

See [docs/quick-reference.md](docs/quick-reference.md) for current status and [docs/architecture.md](docs/architecture.md) for implementation details.

## License

MIT

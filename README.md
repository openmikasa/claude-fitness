# Claude Fitness

AI-powered fitness tracking and workout programming application built with Next.js, Supabase, and Claude AI.

## Features

- 🏋️ **Workout Logging** - Track strength, cardio, sauna, and mobility sessions
- 📊 **History Management** - View, search, and filter past workouts
- 🤖 **AI Programming** - Get personalized workout recommendations from Claude AI
- 📥 **CSV Import** - Import historical workout data
- 🔐 **Secure Authentication** - User accounts with row-level security

## Tech Stack

- **Frontend:** Next.js 14+ with TypeScript (App Router)
- **Backend:** Supabase (PostgreSQL + Auth)
- **AI:** Claude API (Opus 4.5)
- **Styling:** Tailwind CSS (mobile-first)
- **State:** React Query + React Context
- **Forms:** React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Clone and Install

```bash
cd claude-fitness
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. Go to **SQL Editor** and run the migration:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in SQL Editor

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
claude-fitness/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/              # Authentication
│   │   ├── workouts/           # Workout logging & history
│   │   ├── programs/           # AI training plans
│   │   └── api/                # API routes (future)
│   ├── components/             # React components
│   │   ├── auth/               # Login/signup forms
│   │   ├── workout/            # Workout forms & list
│   │   ├── ai/                 # AI recommendation cards
│   │   ├── import/             # CSV upload & mapping
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── ai/                 # Claude API integration
│   │   ├── parsers/            # CSV parsing utilities
│   │   └── hooks/              # React hooks
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── migrations/             # Database schema
├── public/                     # Static assets
└── package.json
```

## Database Schema

### Tables

- **profiles** - User profile information
- **workouts** - Workout entries (polymorphic JSONB design)
- **programs** - AI-generated training plans
- **exercises** - Exercise definitions for autocomplete
- **import_batches** - CSV import history

### Row-Level Security

All tables enforce RLS policies ensuring users can only access their own data.

## Development Phases

- ✅ **Phase 1: Foundation** - Project setup, auth, basic layout
- ⏳ **Phase 2: Workout Logging** - Forms for all workout types
- ⏳ **Phase 3: History & Search** - Filtering, pagination, search
- ⏳ **Phase 4: CSV Import** - Historical data import
- ⏳ **Phase 5: AI Integration** - Workout recommendations
- ⏳ **Phase 6: Polish** - PWA, performance, mobile optimization

## Usage

### Creating an Account

1. Navigate to `/login`
2. Click "Don't have an account? Sign up"
3. Enter email and password
4. Check your email to confirm account

### Logging a Workout

1. Click "Log Workout" from dashboard
2. Select workout type (strength/cardio/sauna/mobility)
3. Fill in workout details
4. Add optional notes
5. Submit

### Viewing History

1. Click "View History" from dashboard
2. Filter by workout type or date range
3. Search for specific exercises
4. Click any workout to view details

### Getting AI Recommendations

1. Log a workout
2. AI automatically analyzes your performance
3. View recommended next session
4. Request full 7-day training plan

## API Routes (Future)

- `POST /api/workouts` - Create workout
- `GET /api/workouts` - List workouts
- `POST /api/import` - Import CSV
- `POST /api/ai/next-session` - Generate next workout
- `POST /api/ai/weekly-plan` - Generate 7-day plan

## Contributing

This is a personal project following the implementation plan in `CLAUDE.md`.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

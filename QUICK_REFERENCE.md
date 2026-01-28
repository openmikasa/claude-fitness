# Quick Reference - Claude Fitness

**Last Updated:** January 27, 2026
**Status:** Phase 3 Complete (50% done)

---

## ⚡ Quick Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality

# File Structure
tree src -L 2        # View project structure
find src -name "*.tsx" | wc -l  # Count components
```

---

## 📂 Important Files

### Documentation
- `PROJECT_PLAN.md` ⭐ - **READ THIS FIRST** - Complete implementation plan
- `CLAUDE.md` - Coding standards and project guidelines
- `README.md` - Setup instructions
- `PHASE1_COMPLETE.md` - Foundation phase summary
- `PHASE2_COMPLETE.md` - Workout logging phase summary
- `PHASE3_COMPLETE.md` - History & search phase summary

### Configuration
- `.env.local` - Environment variables (create from `.env.example`)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind CSS config

### Database
- `supabase/migrations/001_initial_schema.sql` - Database schema

### Core Code
- `src/types/workout.ts` - TypeScript type definitions
- `src/lib/supabase/client.ts` - Database client
- `src/lib/hooks/useAuth.tsx` - Authentication
- `src/lib/hooks/useWorkouts.ts` - React Query hooks
- `src/app/api/workouts/route.ts` - Main API endpoint

---

## 🎯 Current Status

### ✅ What Works Now
- Sign up / Login
- Log workouts (strength, cardio, sauna, mobility)
- View workout history
- Filter workouts (type, date, search)
- Edit workouts
- Delete workouts
- See statistics and PRs
- Search exercise names
- React Query caching

### ⏳ What's Next
**Choose Your Path:**

**Option A: Phase 4 - CSV Import**
- Import historical workout data
- Column mapping interface
- See `PROJECT_PLAN.md` → Phase 4

**Option B: Phase 5 - AI Integration**
- Claude API for recommendations
- Next workout suggestions
- 7-day training plans
- See `PROJECT_PLAN.md` → Phase 5

**Option C: Phase 6 - Polish & PWA**
- Mobile app installation
- Offline support
- Performance optimization
- See `PROJECT_PLAN.md` → Phase 6

---

## 🚀 Getting Started After Break

### If You Cleared the Conversation:

1. **Read the Plan**
   ```bash
   cat PROJECT_PLAN.md
   # Or open in VS Code
   code PROJECT_PLAN.md
   ```

2. **Check Current Status**
   ```bash
   cat PHASE3_COMPLETE.md
   # See what was completed last
   ```

3. **Run the App**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

4. **Choose Next Phase**
   - Read `PROJECT_PLAN.md` sections:
     - Phase 4: CSV Import
     - Phase 5: AI Integration
     - Phase 6: Polish & PWA

5. **Start Implementing**
   - Follow task list for chosen phase
   - Use multiple agents for parallel work
   - Update plan when phase complete

---

## 📊 Project Stats

- **Total Files:** 30 TypeScript/React files
- **Total Lines:** 4,149 lines of code
- **Phases Complete:** 3/6 (50%)
- **Build Status:** ✅ Passing
- **TypeScript Errors:** 0

---

## 🔑 Key Commands to Resume

### Test Current Features
```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:3000

# Test workflow:
# 1. Sign up at /login
# 2. Log workout at /workouts/log
# 3. View history at /workouts
# 4. Edit a workout
# 5. Check stats
```

### Continue Development
```bash
# For CSV Import (Phase 4)
mkdir -p src/components/import
mkdir -p src/app/api/import

# For AI Integration (Phase 5)
mkdir -p src/lib/ai
mkdir -p src/app/api/ai/{next-session,weekly-plan}
mkdir -p src/components/ai

# For PWA (Phase 6)
mkdir -p public/icons
touch public/manifest.json
```

---

## 🆘 Common Issues

### Build Failing
```bash
# Clear build cache
rm -rf .next
npm run build
```

### Database Issues
```bash
# Check Supabase connection
# 1. Verify .env.local has correct values
# 2. Test login at http://localhost:3000/login
# 3. Check Supabase dashboard for errors
```

### Missing Dependencies
```bash
# Reinstall all packages
rm -rf node_modules
npm install
```

---

## 📞 Where to Get Help

1. **Read `PROJECT_PLAN.md`** - Detailed implementation guide
2. **Read `CLAUDE.md`** - Coding standards
3. **Check Phase Summaries** - `PHASE*_COMPLETE.md` files
4. **Review Code** - Look at existing implementations
5. **Ask Claude** - Reference this quick guide

---

## 🎨 Project Structure (Quick View)

```
claude-fitness/
├── PROJECT_PLAN.md          ⭐ Start here
├── QUICK_REFERENCE.md       ⭐ This file
├── CLAUDE.md                Coding standards
├── README.md                Setup guide
├── package.json             Dependencies
├── .env.local              Secrets (create this)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── src/
    ├── app/                 Next.js pages
    │   ├── api/            API routes
    │   ├── workouts/       Workout pages
    │   ├── programs/       AI programs
    │   └── login/          Auth pages
    ├── components/          React components
    │   ├── workout/        Workout forms & list
    │   ├── ai/             AI components
    │   ├── import/         CSV import
    │   └── ui/             Reusable UI
    ├── lib/                Utilities
    │   ├── supabase/       Database clients
    │   ├── ai/             AI integration
    │   ├── hooks/          React hooks
    │   └── providers/      Context providers
    └── types/              TypeScript types
```

---

**Remember:** When resuming work, always read `PROJECT_PLAN.md` first! 📖

# Quick Reference - Claude Fitness

**Last Updated:** January 31, 2026
**Status:** All 6 Phases Complete (100% done) ✅

---

## ⚡ Quick Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run lint         # Check code quality

# Testing
npx playwright install
npx playwright test

# Database (local)
supabase start
supabase db reset
```

---

## 🎯 Current Status

### ✅ All Features Implemented

- User authentication
- Strength training workout logging
- Advanced filtering (equipment, muscle groups, date range)
- Settings persistence across devices
- CSV import (5,000 row limit)
- AI-powered recommendations
- React Query caching
- Offline support for settings

### 📊 Project Stats

- **Phases Complete:** 6/6 (100%) ✅
- **Build Status:** ✅ Passing
- **TypeScript Errors:** 0
- **Total Files:** 60+
- **Lines of Code:** ~4,200

---

## 🚀 Potential Enhancements

- Progressive Web App (PWA) manifest and service worker
- Advanced analytics dashboard with charts
- Export workouts (CSV/JSON/PDF)
- Social features (share workouts)
- Integration with fitness trackers

---

## 📂 Key File Locations

**For detailed file structure, see [architecture.md](architecture.md)**

```
src/
├── app/                 # Next.js pages & API routes
├── components/          # React components
├── lib/                 # Utilities & hooks
└── types/              # TypeScript definitions

supabase/migrations/    # Database schema
```

---

## 🆘 Troubleshooting

**Build failing:**
```bash
rm -rf .next && npm run build
```

**Database issues:**
- Verify `.env.local` has correct Supabase credentials
- Check Supabase dashboard for errors

**Missing dependencies:**
```bash
rm -rf node_modules && npm install
```

---

## 📖 More Information

- **Complete architecture:** [architecture.md](architecture.md)
- **Coding standards:** [../CLAUDE.md](../CLAUDE.md)
- **Setup guide:** [../README.md](../README.md)
- **Deployment:** [deployment.md](deployment.md)
- **History:** [archive/HISTORY.md](archive/HISTORY.md)

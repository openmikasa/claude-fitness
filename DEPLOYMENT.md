# 🚀 Deployment Guide - Vercel

## Quick Deploy

1. **Go to Vercel**: https://vercel.com/new
2. **Import Repository**:
   - Click "Import Git Repository"
   - Select: `openmikasa/claude-fitness`
   - Framework Preset: Next.js (auto-detected)

3. **Configure Build** (should auto-fill):
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Add Environment Variables** (CRITICAL!):
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   ```
   
   **Get values from**: https://github.com/openmikasa/claude-fitness-secrets
   - Download the `.env.local` file
   - Copy each value into Vercel

5. **Deploy**: Click "Deploy"

## After Deployment

You'll get a URL like: `https://claude-fitness-xxxxx.vercel.app`

### 📱 Install on Phone

1. Open the Vercel URL on your phone
2. iOS: Tap Share → "Add to Home Screen"
3. Android: Tap Menu → "Install App"
4. App appears on home screen like a native app!

### 🔄 Auto-Deploy

- Every push to `main` branch auto-deploys
- Push updates: They go live in ~2 minutes

## Environment Variable Checklist

Make sure ALL these are in Vercel:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] ANTHROPIC_API_KEY

## Troubleshooting

**Build fails**: Check environment variables
**Database errors**: Verify Supabase migrations ran
**Can't login**: Check Supabase URL and keys

---

**Quick Links**:
- Public Repo: https://github.com/openmikasa/claude-fitness
- Secrets Repo: https://github.com/openmikasa/claude-fitness-secrets
- Vercel Dashboard: https://vercel.com/dashboard

# Deployment Instructions

## 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `claude-fitness`
3. Description: `AI-powered fitness tracking app`
4. Visibility: **Private** (recommended - contains deployment configs)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

## 2. Push to GitHub

```bash
# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/claude-fitness.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Vercel (Free)

1. Go to https://vercel.com
2. Click "Import Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Add Environment Variables** (IMPORTANT!):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

6. Click "Deploy"

## 4. Access from Phone

Once deployed, Vercel gives you a URL like:
`https://claude-fitness.vercel.app`

- Open on your phone's browser
- Click "Share" → "Add to Home Screen"
- App installs as PWA!

## Security Checklist

✅ `.env.local` is gitignored (secrets safe)
✅ `.env.example` committed (template only)
✅ Supabase RLS enabled (database security)
✅ Environment variables in Vercel (not in code)
✅ HTTPS by default (Vercel)

## Troubleshooting

- **Build fails**: Check environment variables in Vercel
- **Database errors**: Run migrations in Supabase
- **API errors**: Verify Supabase URL and keys

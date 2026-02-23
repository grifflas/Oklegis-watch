# OKLegis.Watch — Setup Guide
## Oklahoma Legislative Tracker | Auto-Updates Daily | 100% Free

---

## What You're Getting
A live website that:
- Pulls all Oklahoma 2026 bills every morning at 6am CT automatically
- Shows bills moving through committees with progress tracking
- Displays lobbyist disclosures on each bill
- Gives you AI constitutional review in Sen. Kennedy's voice
- Generates a daily AI legislative briefing

---

## Step 1 — Create a Free GitHub Account
1. Go to **github.com**
2. Click "Sign up" — it's free, no credit card
3. Create your account

---

## Step 2 — Upload This Project to GitHub
1. Once logged in, click the **+** button (top right) → "New repository"
2. Name it: `oklegis-watch`
3. Make it **Public**
4. Click "Create repository"
5. On the next page, click **"uploading an existing file"**
6. Drag and drop ALL the files from this folder into the upload area
7. Make sure you upload the folder structure:
   - `netlify.toml`
   - `package.json`
   - `public/index.html`
   - `netlify/functions/api.mjs`
   - `netlify/functions/fetch-bills.mjs`
8. Click "Commit changes"

---

## Step 3 — Create a Free Netlify Account
1. Go to **netlify.com**
2. Click "Sign up" → choose "Sign up with GitHub"
3. Authorize Netlify to access your GitHub

---

## Step 4 — Deploy Your Site on Netlify
1. In Netlify, click **"Add new site"** → "Import an existing project"
2. Choose **GitHub**
3. Select your `oklegis-watch` repository
4. Leave all build settings as-is (Netlify will detect them automatically)
5. Click **"Deploy site"**
6. Wait ~2 minutes — your site will be live at a URL like `random-name-123.netlify.app`

---

## Step 5 — Get Your Free LegiScan API Key
1. Go to **legiscan.com**
2. Click "Register" — completely free, no credit card
3. After logging in, go to your account → **API** section
4. Copy your API key

---

## Step 6 — Get Your Anthropic API Key (for Kennedy AI)
1. Go to **console.anthropic.com**
2. Create an account (you get free credits to start)
3. Go to **API Keys** → Create new key
4. Copy the key

---

## Step 7 — Add Your API Keys to Netlify (THE IMPORTANT STEP)
This is what makes it all work — and keeps your keys private/secure.

1. In Netlify, go to your site → **Site configuration** → **Environment variables**
2. Click **"Add a variable"**
3. Add this variable:
   - Key: `LEGISCAN_API_KEY`
   - Value: (paste your LegiScan key)
4. Add another variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: (paste your Anthropic key)
5. Click **Save**
6. Go to **Deploys** → click **"Trigger deploy"** → "Deploy site"

---

## Step 8 — Your Site is Live! 🎉
Visit your Netlify URL. The site will:
- Load live Oklahoma bills automatically on every visit
- Run a full refresh every morning at 6am CT
- Generate Kennedy AI constitutional reviews on demand
- Create a fresh AI digest each day

---

## Optional: Get a Custom Domain
Want it at something like `oklegis.watch` or `okbilltracker.com`?
1. Buy a domain at **namecheap.com** (~$10/year)
2. In Netlify → **Domain management** → Add custom domain
3. Follow the DNS instructions (takes ~10 minutes to set up)

---

## Troubleshooting

**Bills aren't loading?**
→ Check that `LEGISCAN_API_KEY` is set in Netlify environment variables
→ Trigger a new deploy after adding variables

**Kennedy AI isn't working?**
→ Check that `ANTHROPIC_API_KEY` is set in Netlify environment variables

**Site not updating daily?**
→ Go to Netlify → Functions → you should see `fetch-bills` scheduled
→ It runs automatically at 6am CT (noon UTC) every day

---

## How Daily Updates Work
Netlify runs the `fetch-bills` function every morning at 6am CT.
It pulls fresh data from LegiScan and the site always shows current bills.
You don't have to do anything — it's fully automatic.

---

## Cost Breakdown
| Service | Cost |
|---------|------|
| GitHub | FREE |
| Netlify hosting | FREE |
| LegiScan API | FREE (30k queries/month) |
| Anthropic API | ~$0.01 per Kennedy review |
| Custom domain (optional) | ~$10/year |

**Monthly total: $0** (or ~$1 if you use Kennedy AI heavily)

---

Built with ❤️ for Oklahoma civic transparency.
Data: LegiScan API · AI: Claude (Anthropic) · Hosting: Netlify

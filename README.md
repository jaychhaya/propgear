# PropGear 🏠

Your personal property portfolio OS — track investments, visualise growth, and discover new opportunities with AI-powered DSR-style suburb research.

---

## Stack

- **Frontend**: React + Vite + Recharts
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (Postgres, free tier)
- **AI**: Claude claude-sonnet-4-20250514 with web search
- **Auth**: JWT + scrypt password hashing

---

## Deployment (30 minutes)

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick a region close to Australia — Singapore or Sydney)
3. Once ready, go to **SQL Editor** and paste + run the contents of `supabase-schema.sql`
4. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (keep this secret, server-side only)

### Step 2 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → `ANTHROPIC_API_KEY`

### Step 3 — Push to GitHub

```bash
cd propgear
git init
git add .
git commit -m "Initial PropGear"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/propgear.git
git push -u origin main
```

### Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **Add New Project** → Import your GitHub repo
3. Vercel auto-detects Vite — no config needed
4. Go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | Any long random string (50+ chars) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

5. Click **Deploy** — your app will be live at `https://propgear.vercel.app` (or similar)

### Step 5 — Install API dependencies

In your Vercel project settings, under **Build & Output**:
- Build command: `npm run build`
- Output directory: `dist`

The serverless functions use `jose` and `@anthropic-ai/sdk`. Add them:

```bash
npm install jose @anthropic-ai/sdk @supabase/supabase-js
```

Then push again and Vercel will install automatically.

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

For local API routes, install Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

---

## Features

### Portfolio Dashboard
- Total portfolio value, equity, LVR, yield at a glance
- Bar chart: purchase price vs current valuation vs loan per property
- Portfolio breakdown pie chart
- 10-year YoY projection with adjustable growth rate slider
- Interest type summary (fixed/variable/split)

### Properties
- Add/edit all financial details: purchase price, valuation, loan, interest rate, type, term
- Rental income tracking (weekly rent, annual expenses, vacancy)
- Airbnb/short stay toggle with nightly rate and occupancy
- Auto-calculated: equity, LVR, gross yield, net yield, capital growth, monthly repayment
- Individual property projection charts

### AI Research Module
- Enter criteria: state, budget, yield target, vacancy tolerance, population growth
- Toggle Airbnb potential and infrastructure focus
- Claude searches live web data and returns DSR-style scored suburbs
- Each suburb shows: overall score, score breakdown (8 factors), market data, AI summary, infrastructure projects, and risks
- Results sorted by score, expandable cards

---

## Estimated Costs

| Service | Cost |
|---|---|
| Vercel | Free (hobby tier) |
| Supabase | Free (up to 500MB, 2 projects) |
| Anthropic API | ~$0.05–0.20 per research query |

A typical research query with web search costs approximately 5–15 cents AUD.

---

## Extending PropGear

Ideas for future additions:
- **Valuation history tracking** — log valuations over time for individual properties
- **Document storage** — attach contracts, rates notices via Supabase Storage
- **Loan calculator** — P&I vs interest-only comparisons
- **Tax summary** — depreciation, deductible expenses export
- **Email alerts** — weekly portfolio snapshot via Resend
- **Property alerts** — notify when similar suburbs score above threshold

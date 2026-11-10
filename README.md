# Scaley

A minimalist, zero-BS fitness and deficit tracker for everyday lifters who eat home-cooked Indian food without a food scale and train in raw local iron gyms. 100% free.

**Live:** https://ezzzy61.github.io/scaley/

## What it does

- **Fuel:** log meals in rotis, katoris, eggs and glasses instead of grams. A one-tap oil toggle per meal (Air/Boiled +0, Home +45, Mess +90, Dhaba +135 kcal) accounts for hidden cooking oil.
- **Real-time deficit meter:** `(BMR + training kcal + steps × 0.045) − eaten`, measured against your goal.
- **Iron:** split templates (Push, Pull, Legs, Upper, Lower, Arms, Full Body), set-by-set kg × reps with "Last: 80kg × 6", plate math for 20 kg and 15 kg bars, and an auto rest timer (60/90/150 s) with a beep and vibration.
- **Diagnostics:** morning weigh-ins with a 7-day moving average, a stall alert after 10+ days without a new low or high, and a 7-day "Figure It Out" mode that measures your real TDEE.
- **Offline-first PWA:** installable, and every write saves on the device first, then syncs to Supabase once you're back online.

## Personal coach (v3)

- **Profile:** state, city and locality; working, student, home or retired; new, returning or regular; diet; optional health notes; coach language (Hinglish or English).
- **Daily check-in:** sleep, energy, stress, soreness and travel time give a readiness score with a train / controlled / light / rest call.
- **Commute & activity:** city-aware one-tap chips (Mumbai local and FOB stairs, Delhi Metro, Bengaluru traffic…), travel days, zone-2 walks, cycling, yoga, Surya Namaskar, cricket, badminton, garba and more. Uses net METs, so resting energy isn't counted twice.
- **Plans:** starter, returning, busy professional, student, home bodyweight, classic Indian 6-day split, low-stress zone-2 fat loss, healthy ageing (55+), joint-friendly. Ranked for your profile, with custom workout templates.
- **Local foods:** regional dishes for the user's state, with photo estimates matched to Scaley's Indian portion table (±10%).
- **Coach (AI), hybrid engines:** sees your check-ins, plan, logs, city and season.
  - *Scaley Free:* a shared chain of Gemini → Groq → OpenRouter free router → Grok (whichever server keys are set; 30 requests/user/day).
  - *Connect OpenRouter:* 1-click OAuth PKCE; each user gets their own key and free-model allowance.
  - *Sign in with Puter:* user-pays access to Grok, GPT, Claude and Gemini from the browser.
  - *Paste a key:* Gemini, Groq, OpenRouter, OpenAI, Anthropic or xAI. Stored on the device only.
  - Automatic fallback to Scaley Free when the user's engine fails.
  - Server secrets: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY` (all optional), `AI_ORDER` to change the chain order.

## v4: your vibe, open data, research-backed results

- **Light / dark / auto themes.** The accent follows your goal (Aggressive Cut orange, Moderate Cut emerald, Recomp teal, Lean Bulk amber, Strength indigo, Diagnostic sky) or your motivation.
- **Motivation profile.** Boxer, pehlwan, mythic warrior, superhero, anime arc, athlete, fauji, faith or family, plus your hero, your why and your own mantras. It sets the fonts (Bebas Neue / Oswald via Fontsource), the daily homescreen line (original lines written for Scaley), "Hype me" AI lines and the coach's tone.
- **Workout music.** Save SoundCloud, Spotify, YouTube or Apple Music links (embedded players), and any other link (JioSaavn, Gaana, Discord…). Vibe chips search phonk, dubstep, desi hip-hop, Bollywood gym, devotional and more. Links show up inside live workouts.
- **Exercise library.** 876 exercises with step-by-step instructions and photos from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), filterable by muscle and home/gym equipment, addable straight into a workout.
- **Packaged foods.** Barcode scan (BarcodeDetector) and search via [Open Food Facts](https://world.openfoodfacts.org) (ODbL), filtered to products sold in India.
- **Raw ingredients per 100 g.** Atta, dals, millets, soya, paneer, meats and more, using approximate IFCT 2017-style values.
- **Results engine.** Double-progression targets for every lift ("Target today: 62.5 kg × 6"), PR confetti (canvas-confetti), a weekly results score (sessions, protein days, steps, sleep, hard sets per muscle), a logging streak, screen wake lock during workouts, and BMI against WHO Asian cut-offs.
- **Science of the day.** 11 plain-English research summaries with links: protein (Morton 2018), volume (Schoenfeld 2017), proximity to failure (Refalo 2023), frequency (Schoenfeld 2019), steps (Paluch 2022), sleep (Nedeltcheva 2010), rate of loss (Helms 2014), post-meal walks (Buffey 2022), stair snacks (Jenkins 2019), Asian BMI (WHO 2004) and ICMR-NIN 2024.

Run `supabase/004_style.sql` once to add the `theme`, `accent_mode` and `motivation` columns.

## Stack

Preact + esbuild static PWA on GitHub Pages; Supabase Auth + Postgres with row-level security (`supabase/schema.sql`, `002_ai.sql`, `003_coach.sql`); private Storage bucket for progress photos; Edge Function `supabase/functions/ai` as the AI gateway (keys live in Supabase secrets, never in the app).

## Develop

```bash
npm ci
npm run build   # outputs dist/
```

`src/config.js` holds the Supabase URL and anon (public) key. Row-level security is what keeps each user's data private. Pushing to `main` deploys through `.github/workflows/deploy.yml`.

## Numbers used

- BMR: Mifflin-St Jeor. Daily target = BMR + planned training (default 250) + step goal × 0.045 + goal offset, with a floor of 1500 kcal (male) / 1200 kcal (female). After a Figure It Out run, the measured TDEE replaces the formula.
- Protein floor: 1.6–2.2 g/kg depending on goal.
- Training estimate: ~0.18 kcal per kg bodyweight per completed set (override it on the dashboard).
- Food values are typical home-portion averages. Check packaged milk or whey labels.

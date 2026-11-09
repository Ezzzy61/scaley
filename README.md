# Scaley

A minimalist, zero-BS fitness and deficit tracker for everyday lifters who eat home-cooked Indian food without a food scale and train in raw local iron gyms. 100% free.

**Live:** https://ezzzy61.github.io/scaley/

## What it does

- **Fuel:** log meals in rotis, katoris, eggs and glasses instead of grams. A one-tap oil toggle per meal (Air/Boiled +0, Home +45, Mess +90, Dhaba +135 kcal) accounts for hidden cooking oil.
- **Real-time deficit meter:** `(BMR + training kcal + steps × 0.045) − eaten`, measured against your goal.
- **Iron:** split templates (Push, Pull, Legs, Upper, Lower, Arms, Full Body), set-by-set kg × reps with "Last: 80kg × 6", plate math for 20 kg and 15 kg bars, and an auto rest timer (60/90/150 s) with a beep and vibration.
- **Diagnostics:** morning weigh-ins with a 7-day moving average, a stall alert after 10+ days without a new low or high, and a 7-day "Figure It Out" mode that measures your real TDEE.
- **Offline-first PWA:** installable, and every write saves on the device first, then syncs to Supabase once you're back online.

## Stack

Preact + esbuild static PWA on GitHub Pages; Supabase Auth (email/password) + Postgres with row-level security (`supabase/schema.sql`).

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

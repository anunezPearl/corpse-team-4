# Team 4: Tongue Twister Generator

Pick a starting letter, get a tongue twister using mostly that letter.

## Status

**Round 1 (Mostafa): built the generator, wrapped it in a Soviet-composer hearing.**

You submit a letter. The app drafts four tongue twisters for it, one per "hearing,"
each harder than the last. Speak each one aloud (or type it, if you have no
microphone) before a countdown runs out. Get it close enough and you're
"approved"; miss it and you're "denounced" and get a fresh twister to retry.
Clear all four hearings without a single denunciation and a hidden four-note
motif (Shostakovich's own D–E♭–C–B signature) resolves into a secret ending.

The letter-in, twister-out contract from round 0 is unchanged — everything
above is scoring and theme around that same core loop.

## What's here

- `index.html` — the whole UI: hearing flow, countdown meter, Web Speech API
  scoring, Web Audio tones, all inline `<style>`/`<script>`, no build step.
- `server.js` — a small zero-dependency Node server. Serves `index.html` and
  proxies twister requests to OpenAI so the API key never reaches the browser
  or the repo.
- `.env.example` — template for required environment variables.

## How to run

```
cp .env.example .env.local
# edit .env.local and set a real OPENAI_API_KEY
node server.js
```

Open `http://localhost:8787`. Chrome or Edge recommended — Web Speech API
support varies by browser; the app falls back to a typed-input mode if
speech recognition isn't available.

`.env.local` is gitignored (see `.gitignore`'s `.env.*` rule) and is never
committed. Only `.env.example` (with placeholder values) is tracked.

## Next up

- A second, harder difficulty tier past hearing IV, for anyone who finds the
  secret ending too easy.
- Multiplayer: two composers judged on the same twister, side by side.
- A leaderboard of fastest "rehabilitated" clears, persisted server-side
  instead of just `localStorage`.
- Real chamber-music audio under the DSCH motif instead of plain oscillator
  tones.
- Pressing Enter in the typed-fallback input already submits; pressing it in
  the letter-select input does not yet trigger "Begin the Hearing."

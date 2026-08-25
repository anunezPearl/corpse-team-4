# Team 4: Tongue Twister Generator

Pick a starting letter, get a tongue twister using mostly that letter.

## Status

**Round 2 (Mostafa): Sopranos trial — Tony tests your loyalty with tongue twisters.**

You're summoned to a sit-down with Tony Soprano. He gives you four tongue twisters, each harder than the last. Nail them all before the countdown runs out and you're "approved" — loyal, not a rat. Stumble and you get "denounced" and have to retry. Clear all four without a single denunciation and Tony reveals you're "made" — a handshake from the boss and a hidden motif (the Sopranos theme whistled across four notes) plays as you're inducted into the family.

Same tongue-twister mechanics as Round 1, completely reskinned as a mob loyalty test. UI now has a New Jersey diner aesthetic, mob-speak, Tony's silhouette, and a "you're made" ending instead of the Shostakovich one.

**Round 2 (Team 3): every twister now smuggles in one long German word.**

Each of the four hearings' prompts now requires exactly one word in the
generated twister to be a real German word of at least 6 syllables, on top
of the mostly-starts-with-the-chosen-letter rule. It stays part of the same
sentence you have to speak/type before the countdown, so the German word is
just one more thing to trip over — the hearing flow, scoring, and secret
ending below are otherwise unchanged.

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

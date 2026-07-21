# PRISM API (Azure Functions)

Frontend talks **only** to `/api/ai-*`. Vendor keys stay in Function App / SWA Application Settings.

## Endpoints

| Route | Method | Body | Response |
|-------|--------|------|----------|
| `/api/ai-chat` | POST | `{ messages: { role, content }[] }` | `{ content }` |
| `/api/ai-speak` | POST | `{ text, voice? }` | Stub `501` until TTS vendor chosen |

## Local

```bash
cp api/local.settings.json.example api/local.settings.json
# set ANTHROPIC_API_KEY or OPENAI_API_KEY + AI_PROVIDER
cd api && npm install
npm start   # http://localhost:7071
```

From the Vite app (`npm run dev`), `/api` is proxied to `7071`.

## Env

- `AI_PROVIDER` — `anthropic` (default) or `openai`
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`
- `OPENAI_API_KEY` / `OPENAI_MODEL`
- `AI_MAX_TOKENS` — default `2048`

Never commit `local.settings.json` with real keys.

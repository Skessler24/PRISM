const { app } = require('@azure/functions')

/**
 * POST /api/ai-speak — stub until a TTS vendor is chosen.
 * Returns { audioBase64: null, format: null, note }
 */
app.http('ai-speak', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ai-speak',
  handler: async (request) => {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    if (request.method === 'OPTIONS') return { status: 204, headers: cors }

    let text = ''
    try {
      const body = await request.json()
      text = String(body?.text || '').slice(0, 80)
    } catch {
      /* ignore */
    }

    return {
      status: 501,
      headers: { ...cors, 'Content-Type': 'application/json' },
      jsonBody: {
        audioBase64: null,
        format: null,
        note: `TTS not configured yet${text ? ` (got: ${text}…)` : ''}. Wire vendor in a follow-up.`,
      },
    }
  },
})

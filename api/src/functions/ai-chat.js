const { app } = require('@azure/functions')

/**
 * POST /api/ai-chat
 * Body: { messages: { role, content }[] }
 * Response: { content: string }  — AppSDK-compatible
 * Keys never leave the Function (ANTHROPIC_API_KEY / OPENAI_API_KEY).
 */
app.http('ai-chat', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ai-chat',
  handler: async (request, context) => {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: cors }
    }

    let body
    try {
      body = await request.json()
    } catch {
      return {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { content: '', error: 'Invalid JSON body' },
      }
    }

    const messages = Array.isArray(body?.messages) ? body.messages : null
    if (!messages || !messages.length) {
      return {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { content: '', error: 'messages[] required' },
      }
    }

    const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
    const maxTokens = Number(process.env.AI_MAX_TOKENS || 2048)

    try {
      let content = ''
      if (provider === 'openai') {
        content = await chatOpenAI(messages, maxTokens, context)
      } else {
        content = await chatAnthropic(messages, maxTokens, context)
      }
      return {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { content },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI request failed'
      context.error('ai-chat error', message)
      const status = /not configured/i.test(message) ? 503 : 502
      return {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { content: '', error: message },
      }
    }
  },
})

async function chatAnthropic(messages, maxTokens, context) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('AI not configured (ANTHROPIC_API_KEY)')

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
  const anthropicMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: String(m.content || '') }))

  if (!anthropicMessages.length) {
    anthropicMessages.push({ role: 'user', content: 'Hello' })
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages: anthropicMessages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    context.warn('Anthropic error', res.status, text.slice(0, 300))
    throw new Error(`Anthropic error ${res.status}`)
  }

  const data = await res.json()
  const parts = Array.isArray(data.content) ? data.content : []
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n')
    .trim()
}

async function chatOpenAI(messages, maxTokens, context) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('AI not configured (OPENAI_API_KEY)')

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: messages.map((m) => ({
        role: m.role === 'system' || m.role === 'assistant' || m.role === 'user' ? m.role : 'user',
        content: String(m.content || ''),
      })),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    context.warn('OpenAI error', res.status, text.slice(0, 300))
    throw new Error(`OpenAI error ${res.status}`)
  }

  const data = await res.json()
  return (data.choices?.[0]?.message?.content || '').trim()
}

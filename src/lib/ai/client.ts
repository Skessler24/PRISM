import type { AiChatResponse, AiMessage, AiSpeakResponse } from './types'

/** Talks only to /api/ai-* — never to Anthropic/OpenAI from the browser. */
export async function chat(messages: AiMessage[]): Promise<AiChatResponse> {
  const res = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  let data: AiChatResponse = { content: '' }
  try {
    data = (await res.json()) as AiChatResponse
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    return {
      content: data.content || '',
      error: data.error || `AI chat failed (${res.status})`,
    }
  }
  return { content: data.content || '', error: data.error }
}

export async function speak(text: string, voice?: string): Promise<AiSpeakResponse> {
  const res = await fetch('/api/ai-speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  })
  try {
    const data = (await res.json()) as AiSpeakResponse & { audio?: string | null }
    return {
      audioBase64: data.audioBase64 ?? data.audio ?? null,
      format: data.format ?? null,
      note: data.note,
    }
  } catch {
    return { audioBase64: null, note: 'Speak endpoint unavailable' }
  }
}

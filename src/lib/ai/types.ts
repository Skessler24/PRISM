export type AiRole = 'system' | 'user' | 'assistant'

export type AiMessage = {
  role: AiRole | string
  content: string
}

export type AiChatResponse = {
  content: string
  error?: string
}

export type AiSpeakResponse = {
  audioBase64: string | null
  format?: string | null
  note?: string
}

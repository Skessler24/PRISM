/** Placeholder — AI client lands in Prompt 4 (talks to /api/ai, never vendor directly). */
export async function chat(messages: { role: string; content: string }[]) {
  console.info('[ai stub] chat()', messages.length, 'messages — wire in Prompt 4')
  return { content: 'AI not wired yet.' }
}

export async function speak(text: string, voice?: string) {
  console.info('[ai stub] speak()', text.slice(0, 40), voice ?? 'default', '— wire in Prompt 4')
  return { audioBase64: null as string | null }
}

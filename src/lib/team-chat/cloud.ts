/** Cloud sync client for PRISM Team Chat — falls back silently when Azure is down. */

export type CloudRoom = {
  code: string
  teamName: string
  members: Array<{ id: string; displayName: string; role: string; joinedAt: string }>
  channels: Array<{ id: string; name: string; description: string; createdAt: string; createdBy: string }>
  messages: Array<{
    id: string
    channelId: string
    authorId: string
    authorName: string
    body: string
    createdAt: string
  }>
  updatedAt: string
}

export type TeamChatCloudResult =
  | { ok: true; room: CloudRoom; offline: false }
  | { ok: false; offline: true; error: string }

async function post(body: Record<string, unknown>): Promise<TeamChatCloudResult> {
  try {
    const res = await fetch('/api/team-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as {
      room?: CloudRoom
      error?: string
      offline?: boolean
    }
    if (!res.ok || !data.room) {
      return {
        ok: false,
        offline: true,
        error: data.error || `Cloud chat unavailable (${res.status})`,
      }
    }
    return { ok: true, room: data.room, offline: false }
  } catch {
    return { ok: false, offline: true, error: 'Cloud chat unreachable — using local only' }
  }
}

export function joinCloudRoom(roomCode: string, clientId: string, displayName: string) {
  return post({ action: 'join', roomCode, clientId, displayName })
}

export function listCloudRoom(roomCode: string) {
  return post({ action: 'list', roomCode })
}

export function postCloudMessage(
  roomCode: string,
  clientId: string,
  displayName: string,
  message: CloudRoom['messages'][number],
) {
  return post({ action: 'post', roomCode, clientId, displayName, message })
}

export function createCloudChannel(
  roomCode: string,
  clientId: string,
  channel: { name: string; description?: string },
) {
  return post({ action: 'createChannel', roomCode, clientId, channel })
}

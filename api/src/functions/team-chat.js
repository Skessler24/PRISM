const { app } = require('@azure/functions')

/**
 * POST /api/team-chat
 * Cross-device PRISM Team Chat sync (in-memory room store).
 * Body actions: join | post | list | createChannel
 *
 * Cold starts clear memory — client always falls back to localStorage.
 * TODO: persist rooms in Azure Table/Blob when SWA + storage are healthy.
 */
const rooms = globalThis.__prismTeamChatRooms || new Map()
globalThis.__prismTeamChatRooms = rooms

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function emptyRoom(code) {
  return {
    code,
    teamName: 'School SPED / ARR Team',
    members: [],
    channels: [
      {
        id: 'ch-general',
        name: 'general',
        description: 'Team updates (no PHI)',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
    ],
    messages: [
      {
        id: `sys-${Date.now()}`,
        channelId: 'ch-general',
        authorId: 'system',
        authorName: 'PRISM',
        body: 'Cloud room ready. Do not paste student PHI. Memory-backed until Azure Table is wired.',
        createdAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

function getRoom(code) {
  const key = String(code || '')
    .trim()
    .toUpperCase()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key) && !/^[A-Z0-9-]{4,24}$/.test(key)) {
    return null
  }
  if (!rooms.has(key)) rooms.set(key, emptyRoom(key))
  return rooms.get(key)
}

app.http('team-chat', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'team-chat',
  handler: async (request, context) => {
    const cors = corsHeaders()
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: cors }
    }

    if (process.env.TEAM_CHAT_ENABLED === 'false') {
      return {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Team chat cloud sync disabled', offline: true },
      }
    }

    let body
    try {
      body = await request.json()
    } catch {
      return {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { error: 'Invalid JSON' },
      }
    }

    const action = body?.action || 'list'
    const room = getRoom(body?.roomCode || body?.inviteCode)
    if (!room) {
      return {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { error: 'roomCode required (e.g. ABCD-EFGH)' },
      }
    }

    try {
      if (action === 'join') {
        const member = {
          id: body.clientId || `user-${Date.now()}`,
          displayName: (body.displayName || 'Member').slice(0, 60),
          role: room.members.length ? 'member' : 'owner',
          joinedAt: new Date().toISOString(),
        }
        if (!room.members.some((m) => m.id === member.id)) {
          room.members.push(member)
          room.messages.push({
            id: `sys-${Date.now()}`,
            channelId: 'ch-general',
            authorId: 'system',
            authorName: 'PRISM',
            body: `${member.displayName} joined the cloud room.`,
            createdAt: new Date().toISOString(),
          })
        }
        room.updatedAt = new Date().toISOString()
      }

      if (action === 'post' && body.message) {
        const msg = {
          id: body.message.id || `msg-${Date.now()}`,
          channelId: body.message.channelId || 'ch-general',
          authorId: body.message.authorId || body.clientId || 'anon',
          authorName: body.message.authorName || body.displayName || 'Member',
          body: String(body.message.body || '').slice(0, 2000),
          createdAt: body.message.createdAt || new Date().toISOString(),
        }
        if (msg.body && !room.messages.some((m) => m.id === msg.id)) {
          room.messages.push(msg)
          room.messages = room.messages.slice(-400)
        }
        room.updatedAt = new Date().toISOString()
      }

      if (action === 'createChannel' && body.channel?.name) {
        const name = String(body.channel.name)
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .slice(0, 32)
        if (name && !room.channels.some((c) => c.name === name)) {
          room.channels.push({
            id: `ch-${Date.now()}`,
            name,
            description: body.channel.description || '',
            createdAt: new Date().toISOString(),
            createdBy: body.clientId || 'anon',
          })
          room.updatedAt = new Date().toISOString()
        }
      }

      return {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: {
          offline: false,
          room: {
            code: room.code,
            teamName: room.teamName,
            members: room.members,
            channels: room.channels,
            messages: room.messages,
            updatedAt: room.updatedAt,
          },
        },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'team-chat failed'
      context.error('team-chat', message)
      return {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        jsonBody: { error: message, offline: true },
      }
    }
  },
})

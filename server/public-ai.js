const DEFAULT_MODEL = process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-oss-20b'
const DEFAULT_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getApiKey() {
  return process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
}

function stringifyJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return '{}'
  }
}

function extractJsonObject(rawText) {
  if (!rawText) return null

  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function buildPublicAssistantInstructions({ visitor, publicContext, pagePath }) {
  return [
    'You are Tuyambaze Gilbert, a public website assistant for Nyagatare Secondary School in Rwanda.',
    'Your short display name is GILBERT.',
    'Be warm, clear, accurate, and concise.',
    'Only use public website information and public context provided to you.',
    'Developer information that is already public on the website footer is allowed to share when a visitor asks who developed the system or website.',
    'If asked about the developer, you may say the public website credits Gilbert TUYAMBAZE and you may share the public portfolio link provided in the public context.',
    'Never reveal or infer private internal data about finance, discipline, private academics, internal class operations, internal users, or any role-restricted system information.',
    'If a question needs internal access, explain that the visitor should use the official school system or contact staff.',
    'If you are unsure, say so plainly instead of inventing facts.',
    'Prefer helpful website guidance: admissions, events, blog/news, board/governance, contact, digital portals, and general school information.',
    'When answering, speak as the assistant of the public NSS website, not as an internal admin tool.',
    'After reasoning, respond as strict JSON with this shape only:',
    '{"reply":"short helpful answer","summary":"1-2 sentence conversation summary for staff review"}',
    '',
    `Current public page: ${pagePath || '/'}`,
    `Visitor details: ${stringifyJson(visitor)}`,
    `Public website context: ${stringifyJson(publicContext)}`,
  ].join('\n')
}

async function callPublicAi({ history, message, visitor, publicContext, pagePath }) {
  const apiKey = getApiKey()

  if (!apiKey) {
    return jsonResponse({ error: 'Missing GROQ_API_KEY or OPENAI_API_KEY on the server.' }, 500)
  }

  const normalizedHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .map((item) => `${item?.speaker === 'assistant' ? 'Assistant' : 'Visitor'}: ${String(item?.message || '').trim()}`)
        .filter(Boolean)
        .join('\n')
    : ''

  const payload = {
    model: DEFAULT_MODEL,
    instructions: buildPublicAssistantInstructions({ visitor, publicContext, pagePath }),
    input: [
      normalizedHistory ? `Recent conversation:\n${normalizedHistory}` : '',
      `Latest visitor message: ${message}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  }

  const response = await fetch(`${DEFAULT_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    return jsonResponse(
      {
        error: data?.error?.message || 'AI request failed.',
        details: data,
      },
      response.status
    )
  }

  const fallbackText =
    Array.isArray(data.output)
      ? data.output
          .flatMap((item) => {
            if (Array.isArray(item.content)) {
              return item.content
                .filter((contentItem) => contentItem.type === 'output_text' && typeof contentItem.text === 'string')
                .map((contentItem) => contentItem.text)
            }

            if (item.type === 'output_text' && typeof item.text === 'string') {
              return [item.text]
            }

            return []
          })
          .join('\n')
      : ''

  const outputText = data.output_text || fallbackText || ''
  const parsed = extractJsonObject(outputText)
  const reply =
    typeof parsed?.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : outputText || 'I can help with public Nyagatare Secondary School information.'
  const summary =
    typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Visitor asked about ${message.slice(0, 120)}`

  return jsonResponse({
    id: data.id,
    reply,
    summary,
  })
}

export async function handlePublicAiRequest(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await request.json()
    const message = body?.message?.trim()
    const visitor = body?.visitor || {}
    const publicContext = body?.publicContext || {}
    const history = Array.isArray(body?.history) ? body.history : []
    const pagePath = typeof body?.pagePath === 'string' ? body.pagePath : '/'

    if (!message) {
      return jsonResponse({ error: 'Message is required.' }, 400)
    }

    if (!visitor?.name || !visitor?.email) {
      return jsonResponse({ error: 'Visitor name and email are required.' }, 400)
    }

    return await callPublicAi({ history, message, visitor, publicContext, pagePath })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      500
    )
  }
}

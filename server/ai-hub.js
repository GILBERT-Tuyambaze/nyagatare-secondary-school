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

function buildSystemInstructions(context) {
  return [
    'You are the NSS AI Hub, an operations assistant for Nyagatare Secondary School.',
    'Be concise, practical, and school-admin oriented.',
    'Prioritize admissions, academics, discipline, finance, and school content operations.',
    'Use the provided dashboard context when it is relevant.',
    'If the user asks for something outside the provided context, answer helpfully but avoid inventing internal facts.',
    '',
    'Current dashboard context:',
    JSON.stringify(context, null, 2),
  ].join('\n')
}

async function callOpenAI({ message, context, previousResponseId }) {
  const apiKey = getApiKey()

  if (!apiKey) {
    return jsonResponse(
      {
        error: 'Missing GROQ_API_KEY on the server. Add it to your environment before using the AI hub.',
      },
      500
    )
  }

  const payload = {
    model: DEFAULT_MODEL,
    instructions: buildSystemInstructions(context),
    input: message,
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
        error: data?.error?.message || 'Groq request failed.',
        provider: 'groq',
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

  return jsonResponse({
    id: data.id,
    output_text: data.output_text || fallbackText || '',
  })
}

export async function handleAiHubRequest(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await request.json()
    const message = body?.message?.trim()
    const context = body?.context || {}
    const previousResponseId = body?.previousResponseId

    if (!message) {
      return jsonResponse({ error: 'Message is required.' }, 400)
    }

    return await callOpenAI({ message, context, previousResponseId })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
      },
      500
    )
  }
}

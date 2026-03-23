const DEFAULT_MODEL = process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'llama-3.1-8b-instant'
const REQUEST_TIMEOUT_MS = 20000

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getProviderConfig() {
  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      provider: 'groq',
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    }
  }

  return null
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
  const providerConfig = getProviderConfig()

  if (!providerConfig) {
    return jsonResponse(
      {
        error: 'Missing GROQ_API_KEY or OPENAI_API_KEY on the server. Add one before using the AI hub.',
      },
      500
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  let data

  try {
    const payload = {
      model: providerConfig.model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: buildSystemInstructions(context),
        },
        {
          role: 'user',
          content: message,
        },
      ],
    }

    response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerConfig.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    data = await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonResponse(
        {
          error: 'The AI hub took too long to respond. Please try again.',
          provider: providerConfig.provider,
        },
        504
      )
    }

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'AI request failed.',
        provider: providerConfig.provider,
      },
      500
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    return jsonResponse(
      {
        error: data?.error?.message || 'AI request failed.',
        provider: providerConfig.provider,
        details: data,
      },
      response.status
    )
  }

  return jsonResponse({
    id: data.id || data?.choices?.[0]?.message?.id || null,
    output_text: data?.choices?.[0]?.message?.content || data?.output_text || '',
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

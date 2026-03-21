import { patchFirestoreDocument } from './firebase-rest.js'

export async function handleDonationWebhookRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const secretHash = process.env.FLW_WEBHOOK_HASH
  if (!secretHash) {
    return new Response(JSON.stringify({ error: 'Missing FLW_WEBHOOK_HASH' }), { status: 500 })
  }

  const signature = request.headers.get('verif-hash')
  if (!signature || signature !== secretHash) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  const event = await request.json()
  try {
    const status = event?.data?.status
    const txRef = event?.data?.tx_ref
    const donationId = event?.data?.meta?.donationId

    if (!donationId || !status || !txRef) {
      return new Response(JSON.stringify({ error: 'Missing donation metadata' }), { status: 400 })
    }

    const mappedStatus =
      status === 'successful'
        ? 'completed'
        : status === 'failed'
          ? 'failed'
          : 'pending'

    await patchFirestoreDocument('donations', donationId, {
      payment_status: mappedStatus,
      payment_reference: event?.data?.flw_ref || txRef,
      payment_link: event?.data?.link || undefined,
      updated_at: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook processing error', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/donations-webhook', 'http://localhost')
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method && req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    duplex: 'half',
  })
  const response = await handleDonationWebhookRequest(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  const buffer = Buffer.from(await response.arrayBuffer())
  res.end(buffer)
}

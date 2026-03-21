import { updateDonation } from '../src/services/firestoreService.js'

export async function handleDonationVerifyRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const secret = process.env.FLW_SECRET_KEY
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Missing FLW_SECRET_KEY' }), { status: 500 })
  }

  const body = await request.json()
  const { transaction_id, tx_ref } = body || {}
  if (!transaction_id || !tx_ref) {
    return new Response(JSON.stringify({ error: 'transaction_id and tx_ref are required' }), { status: 400 })
  }

  try {
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await verifyRes.json()
    if (!verifyRes.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'Verify failed', data }), { status: 400 })
    }

    const metaDonationId = data?.data?.meta?.donationId
    const status = data?.data?.status
    const mappedStatus =
      status === 'successful'
        ? 'completed'
        : status === 'failed'
          ? 'failed'
          : 'pending'

    if (metaDonationId) {
      await updateDonation(metaDonationId, {
        payment_status: mappedStatus,
        payment_reference: data?.data?.flw_ref || tx_ref,
        payment_link: data?.data?.link || undefined,
      })
    }

    return new Response(JSON.stringify({ verified: true, donationId: metaDonationId, status: mappedStatus }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Verify error', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/donations-verify', 'http://localhost')
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method && req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    duplex: 'half',
  })
  const response = await handleDonationVerifyRequest(request)
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  const buffer = Buffer.from(await response.arrayBuffer())
  res.end(buffer)
}

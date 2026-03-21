export async function handleDonationIntentRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Missing FLW_SECRET_KEY' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { amount, currency = 'RWF', email, name, donationId, donationType } = body || {};
    if (!amount || Number(amount) <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.PUBLIC_BASE_URL ||
      'https://nyagataress.edu.rw';

    const txRef = `nss-donation-${donationId || 'public'}-${Date.now()}`;

    const payload = {
      tx_ref: txRef,
      amount: Number(amount),
      currency,
      redirect_url: `${origin.replace(/\/$/, '')}/donation-complete?tx_ref=${encodeURIComponent(txRef)}`,
      customer: {
        email: email || 'donor@nyagataress.edu.rw',
        name: name || 'NSS Donor',
      },
      payment_options: 'card,mobilemoneyrw,mobilemoneyuganda',
      customization: {
        title: 'Nyagatare Secondary School Donation',
        description: `Support ${donationType || 'NSS STEM and academics'}`,
      },
      meta: {
        donationId: donationId || null,
      },
    };

    const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await fwRes.json();
    if (!fwRes.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'Flutterwave error', data }), { status: 400 });
    }

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Flutterwave intent error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/donations-intent', 'http://localhost');
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.method && req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    duplex: 'half',
  });
  const response = await handleDonationIntentRequest(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

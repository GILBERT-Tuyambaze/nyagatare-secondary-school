function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} on the server.`)
  }
  return value
}

function buildInviteEmail({ schoolName, inviterName, role, signupUrl, expiresAt }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#020617;padding:32px;color:#e2e8f0;">
      <div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid rgba(34,211,238,0.25);border-radius:20px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#67e8f9;">${schoolName}</p>
        <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#ffffff;">You have been invited to join the NSS system</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.7;">
          ${inviterName} invited you to create an account as <strong>${role}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">
          Use the secure button below to create your account and enter the platform directly.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${signupUrl}" style="display:inline-block;background:#22d3ee;color:#020617;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px;">Create Your Account</a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#cbd5e1;">
          If the button does not open, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;word-break:break-all;color:#67e8f9;">${signupUrl}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
          This invitation expires on ${new Date(expiresAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}.
        </p>
      </div>
    </div>
  `
}

export async function handleInviteEmailRequest(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const resendApiKey = getRequiredEnv('RESEND_API_KEY')
    const from = getRequiredEnv('RESEND_FROM_EMAIL')
    const replyTo = process.env.RESEND_REPLY_TO || from
    const schoolName = process.env.RESEND_SCHOOL_NAME || 'Nyagatare Secondary School'

    const body = await request.json()
    const email = body?.email?.trim()
    const role = body?.role?.trim()
    const inviterName = body?.inviterName?.trim()
    const signupUrl = body?.signupUrl?.trim()
    const expiresAt = body?.expiresAt?.trim()

    if (!email || !role || !inviterName || !signupUrl || !expiresAt) {
      return jsonResponse({ error: 'Email payload is incomplete.' }, 400)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': body?.inviteId || signupUrl,
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: replyTo,
        subject: `${schoolName}: your ${role} invitation`,
        html: buildInviteEmail({
          schoolName,
          inviterName,
          role,
          signupUrl,
          expiresAt,
        }),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return jsonResponse(
        {
          error: data?.message || data?.error || 'Resend email request failed.',
          provider: 'resend',
          details: data,
        },
        response.status
      )
    }

    return jsonResponse({
      ok: true,
      id: data?.id || null,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown email server error',
      },
      500
    )
  }
}

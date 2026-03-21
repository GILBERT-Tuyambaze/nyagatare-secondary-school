function requireEnv(name, fallback) {
  const value = process.env[name] || fallback
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function getFirebaseConfig() {
  return {
    apiKey: requireEnv('FIREBASE_API_KEY', process.env.VITE_FIREBASE_API_KEY),
    projectId: requireEnv('FIREBASE_PROJECT_ID', process.env.VITE_FIREBASE_PROJECT_ID),
    email: requireEnv('FIREBASE_SERVER_EMAIL', process.env.VITE_ADMIN_EMAILS?.split(',')[0]?.trim()),
    password: requireEnv('FIREBASE_SERVER_PASSWORD', process.env.SUPERADMIN_PASSWORD),
  }
}

async function signInWithPassword() {
  const { apiKey, email, password } = getFirebaseConfig()

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  )

  const data = await response.json()
  if (!response.ok || !data.idToken) {
    throw new Error(data?.error?.message || 'Failed to sign in to Firebase REST API')
  }

  return data.idToken
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`)
}

export async function patchFirestoreDocument(collection, documentId, updates) {
  const idToken = await signInWithPassword()
  const { projectId } = getFirebaseConfig()

  const fieldPaths = Object.keys(updates)
  const query = fieldPaths.map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join('&')
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(documentId)}` +
    `?${query}`

  const fields = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [key, toFirestoreValue(value)])
  )

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to patch Firestore document')
  }

  return data
}

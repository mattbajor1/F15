import * as admin from 'firebase-admin'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { onRequest } from 'firebase-functions/v2/https'

admin.initializeApp()

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(cookieParser())

// Emulator CORS
const isEmu =
  process.env.FUNCTIONS_EMULATOR === 'true' ||
  !!process.env.FIREBASE_EMULATOR_HUB
if (isEmu) app.use(cors({ origin: true, credentials: true }))

const ALLOWED_DOMAIN = 'frame15.com'
const SESSION_COOKIE_NAME = '__session'

function isCompanyEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

async function verifyFromAuthHeader(req: express.Request) {
  const h = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  if (!m) return null
  try {
    return await admin.auth().verifyIdToken(m[1], true)
  } catch {
    return null
  }
}

async function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  let decoded: admin.auth.DecodedIdToken | null = await verifyFromAuthHeader(req)
  if (!decoded) {
    const cookie = req.cookies[SESSION_COOKIE_NAME]
    if (cookie) {
      try {
        decoded = await admin.auth().verifySessionCookie(cookie, true)
      } catch {
        decoded = null
      }
    }
  }
  if (!decoded || !isCompanyEmail(decoded.email)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  ;(req as any).user = { uid: decoded.uid, email: decoded.email }
  next()
}

// --- Auth exchange: ID token -> session cookie ---
app.post('/auth/sessionLogin', async (req, res) => {
  const { idToken } = req.body || {}
  if (!idToken) return res.status(400).json({ error: 'idToken required' })
  try {
    const decoded = await admin.auth().verifyIdToken(idToken, true)
    if (!isCompanyEmail(decoded.email)) {
      return res.status(403).json({ error: 'Forbidden: company email required' })
    }
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })

    // ✅ make sure this is a boolean
    const secure = process.env.FUNCTIONS_EMULATOR !== 'true'

    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure,                    // boolean (no union types)
      sameSite: 'none' as 'none',// helps older @types/express
      path: '/',
    })
    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

app.post('/auth/sessionLogout', async (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

// --- Public health check ---
app.get('/health', (_req, res) => res.json({ ok: true }))

// --- Protected routes ---
app.use(authMiddleware)

app.get('/projects', (_req, res) => {
  res.json([
    { id: 'dusk-till-dawn', name: 'Dusk Till Dawn', client: 'Noir Pictures', status: 'Production' },
  ])
})

app.get('/projects/:id', (req, res) => {
  const { id } = req.params
  res.json({ id, name: 'Dusk Till Dawn', client: 'Noir Pictures', status: 'Production' })
})

// Gen-2 HTTP function; public invoker so Hosting can reach it
export const api = onRequest({ region: 'us-central1', invoker: 'public' }, app)

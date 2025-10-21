import admin from 'firebase-admin'
import express from 'express'
import cookieParser from 'cookie-parser'
import { onRequest } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'

admin.initializeApp()
const db = admin.firestore()

// Define Gemini API key parameter
const geminiApiKey = defineString('GEMINI_API_KEY')

const app = express()
app.disable('x-powered-by')

// CORS - Must be before other middleware
const isEmu = process.env.FUNCTIONS_EMULATOR === 'true' || !!process.env.FIREBASE_EMULATOR_HUB

// Define the CORS options
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}

// Apply CORS middleware for both emulator and production
app.use((req, res, next) => {
  const origin = req.header('Origin')
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','))
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','))
    res.header('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(','))
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400')
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())
app.use(cookieParser())

// Create a router for API routes
const router = express.Router()

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

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip auth in emulator for development
  if (isEmu) {
    ;(req as any).user = { uid: 'dev-user', email: 'dev@frame15.com' }
    return next()
  }

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

// --- Auth endpoints ---
router.post('/auth/sessionLogin', async (req, res) => {
  const { idToken } = req.body || {}
  if (!idToken) return res.status(400).json({ error: 'idToken required' })
  try {
    const decoded = await admin.auth().verifyIdToken(idToken, true)
    if (!isCompanyEmail(decoded.email)) {
      return res.status(403).json({ error: 'Forbidden: company email required' })
    }
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })
    const isProd = !!(process.env.GCLOUD_PROJECT && !isEmu)
    res.cookie(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
    })

    // Create or update user profile
    const userRef = db.collection('users').doc(decoded.uid)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      await userRef.set({
        email: decoded.email,
        displayName: decoded.name || '',
        photoURL: decoded.picture || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Session login error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

router.post('/auth/sessionLogout', async (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

router.get('/health', (_req, res) => res.json({ ok: true }))

// --- Protected routes ---
router.use(authMiddleware)

// ============ USER PROFILE ============
router.get('/profile', async (req, res) => {
  try {
    const user = (req as any).user
    const doc = await db.collection('users').doc(user.uid).get()
    if (!doc.exists) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const user = (req as any).user
    const data = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    await db.collection('users').doc(user.uid).set(data, { merge: true })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ============ DASHBOARD ============
router.get('/dashboard/metrics', async (_req, res) => {
  try {
    const projectsSnap = await db.collection('projects').get()
    const activeProjects = projectsSnap.docs.filter(d =>
      ['Planning', 'Pre-production', 'Production', 'Post-production'].includes(d.data().status)
    ).length

    let totalTasks = 0
    for (const doc of projectsSnap.docs) {
      const tasksSnap = await db.collection('projects').doc(doc.id).collection('tasks').where('completed', '==', false).get()
      totalTasks += tasksSnap.size
    }

    const inventorySnap = await db.collection('inventory').get()
    const availableEquipment = inventorySnap.docs.filter(d => d.data().status === 'Available').length
    const availablePercentage = inventorySnap.size > 0 ? Math.round((availableEquipment / inventorySnap.size) * 100) : 0

    const recentProjects = projectsSnap.docs
      .sort((a, b) => b.data().updatedAt?.toMillis() - a.data().updatedAt?.toMillis())
      .slice(0, 5)
      .map(d => ({ id: d.id, ...d.data() }))

    res.json({ activeProjects, openTasks: totalTasks, availableEquipment: availablePercentage, recentProjects })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' })
  }
})

// ============ PROJECTS ============
router.get('/projects', async (_req, res) => {
  try {
    const snap = await db.collection('projects').orderBy('updatedAt', 'desc').get()
    const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

router.post('/projects', async (req, res) => {
  try {
    const user = (req as any).user
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid
    }
    const ref = await db.collection('projects').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

router.get('/projects/:id', async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.id).get()
    if (!doc.exists) return res.status(404).json({ error: 'Project not found' })
    res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

router.put('/projects/:id', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    await db.collection('projects').doc(req.params.id).update(data)
    res.json({ id: req.params.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

router.delete('/projects/:id', async (req, res) => {
  try {
    await db.collection('projects').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ============ TASKS ============
router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const snap = await db.collection('projects').doc(req.params.projectId).collection('tasks').orderBy('dueDate').get()
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('projects').doc(req.params.projectId).collection('tasks').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

router.put('/projects/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    await db.collection('projects').doc(req.params.projectId).collection('tasks').doc(req.params.taskId).update(data)
    res.json({ id: req.params.taskId, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

router.delete('/projects/:projectId/tasks/:taskId', async (req, res) => {
  try {
    await db.collection('projects').doc(req.params.projectId).collection('tasks').doc(req.params.taskId).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ============ EQUIPMENT (Project Assignment) ============
router.get('/projects/:projectId/equipment', async (req, res) => {
  try {
    const snap = await db.collection('projects').doc(req.params.projectId).collection('equipment').get()
    const equipment = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(equipment)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment' })
  }
})

router.post('/projects/:projectId/equipment', async (req, res) => {
  try {
    const data = {
      ...req.body,
      assignedDate: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('projects').doc(req.params.projectId).collection('equipment').add(data)

    // Update inventory item status
    if (req.body.equipmentId) {
      await db.collection('inventory').doc(req.body.equipmentId).update({
        status: 'In Use',
        currentProject: req.params.projectId
      })
    }

    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign equipment' })
  }
})

router.delete('/projects/:projectId/equipment/:equipmentId', async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.projectId).collection('equipment').doc(req.params.equipmentId).get()
    const data = doc.data()

    await db.collection('projects').doc(req.params.projectId).collection('equipment').doc(req.params.equipmentId).delete()

    // Update inventory item status back to available
    if (data?.equipmentId) {
      await db.collection('inventory').doc(data.equipmentId).update({
        status: 'Available',
        currentProject: null
      })
    }

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove equipment' })
  }
})

// ============ MARKETING ============
router.get('/projects/:projectId/marketing', async (req, res) => {
  try {
    const snap = await db.collection('projects').doc(req.params.projectId).collection('marketing').orderBy('createdAt', 'desc').get()
    const marketing = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(marketing)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketing posts' })
  }
})

router.post('/projects/:projectId/marketing', async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('projects').doc(req.params.projectId).collection('marketing').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create marketing post' })
  }
})

router.put('/projects/:projectId/marketing/:marketingId', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    await db.collection('projects').doc(req.params.projectId).collection('marketing').doc(req.params.marketingId).update(data)
    res.json({ id: req.params.marketingId, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update marketing post' })
  }
})

router.delete('/projects/:projectId/marketing/:marketingId', async (req, res) => {
  try {
    await db.collection('projects').doc(req.params.projectId).collection('marketing').doc(req.params.marketingId).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete marketing post' })
  }
})

// ============ INVOICES ============
router.get('/projects/:projectId/invoices', async (req, res) => {
  try {
    const snap = await db.collection('projects').doc(req.params.projectId).collection('invoices').orderBy('date', 'desc').get()
    const invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

router.post('/projects/:projectId/invoices', async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('projects').doc(req.params.projectId).collection('invoices').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

router.put('/projects/:projectId/invoices/:invoiceId', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    await db.collection('projects').doc(req.params.projectId).collection('invoices').doc(req.params.invoiceId).update(data)
    res.json({ id: req.params.invoiceId, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

router.delete('/projects/:projectId/invoices/:invoiceId', async (req, res) => {
  try {
    await db.collection('projects').doc(req.params.projectId).collection('invoices').doc(req.params.invoiceId).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

// ============ INVENTORY ============
router.get('/inventory', async (_req, res) => {
  try {
    const snap = await db.collection('inventory').orderBy('name').get()
    const inventory = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

router.post('/inventory', async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('inventory').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
})

router.put('/inventory/:id', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    await db.collection('inventory').doc(req.params.id).update(data)
    res.json({ id: req.params.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
})

router.delete('/inventory/:id', async (req, res) => {
  try {
    await db.collection('inventory').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' })
  }
})

// ============ AI MARKETING ============
router.post('/marketing/generate', async (req, res) => {
  try {
    const {
      contentType,
      projectName,
      projectDescription,
      customPrompt,
      tone = 'professional',
      targetAudience = '',
      length = 'medium'
    } = req.body

    // Build enhanced prompt for Gemini with film industry context
    const companyContext = 'Frame 15 is a film production company specializing in high-quality video production.'

    let basePrompt = ''
    let lengthGuide = ''

    // Set length guidelines
    switch (length) {
      case 'short':
        lengthGuide = 'Keep it concise and punchy (1-2 paragraphs or 50-100 words).'
        break
      case 'long':
        lengthGuide = 'Write a comprehensive and detailed piece (5+ paragraphs or 500+ words).'
        break
      default: // medium
        lengthGuide = 'Write a well-developed piece (3-4 paragraphs or 200-400 words).'
    }

    // Build content-specific prompts with industry context
    switch (contentType) {
      case 'social-post':
        basePrompt = `Create an engaging social media post for a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Make it attention-grabbing and shareable. Include relevant hashtags. ${lengthGuide}`
        break

      case 'email':
        basePrompt = `Write a professional email campaign for a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Include a compelling subject line and clear call-to-action. ${lengthGuide}`
        break

      case 'blog':
        basePrompt = `Write an engaging blog post about a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Make it informative and SEO-friendly. Include an engaging title and subheadings. ${lengthGuide}`
        break

      case 'ad-copy':
        basePrompt = `Create persuasive advertising copy for a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Focus on benefits and include a strong call-to-action. ${lengthGuide}`
        break

      case 'press-release':
        basePrompt = `Write a professional press release for a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Follow AP style. Include headline, dateline, and boilerplate. ${lengthGuide}`
        break

      case 'seo-description':
        basePrompt = `Write an SEO-optimized meta description for a film/video production${projectName ? ` titled "${projectName}"` : ''}. ${companyContext}`
        if (projectDescription) basePrompt += ` Project details: ${projectDescription}`
        basePrompt += ` Keep it under 160 characters, include keywords, and make it compelling.`
        break

      default:
        basePrompt = `Create marketing content for${projectName ? ` "${projectName}"` : ' a film/video production'}. ${companyContext} ${lengthGuide}`
    }

    // Add tone specification
    let toneInstruction = ''
    switch (tone) {
      case 'professional':
        toneInstruction = 'Use a professional, polished tone suitable for business communications.'
        break
      case 'creative':
        toneInstruction = 'Use a creative, artistic tone that showcases innovation and storytelling.'
        break
      case 'casual':
        toneInstruction = 'Use a friendly, conversational tone that feels approachable and relatable.'
        break
      case 'urgent':
        toneInstruction = 'Use an urgent, action-oriented tone that creates excitement and FOMO.'
        break
      case 'inspiring':
        toneInstruction = 'Use an inspiring, emotional tone that moves the audience.'
        break
    }

    // Add target audience
    if (targetAudience) {
      basePrompt += ` Target audience: ${targetAudience}.`
    }

    // Combine all prompt elements
    const prompt = `${basePrompt} ${toneInstruction}${customPrompt ? ` Additional instructions: ${customPrompt}` : ''}`

    // Call Gemini API
    const apiKey = geminiApiKey.value()
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error('Gemini API request failed')
    }

    const geminiData: any = await geminiResponse.json()
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate content'

    // Save to history with enhanced metadata
    await db.collection('marketing_history').add({
      type: contentType,
      content,
      projectName: projectName || null,
      tone,
      targetAudience: targetAudience || null,
      length,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ content })
  } catch (error) {
    console.error('Failed to generate marketing content:', error)
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

router.get('/marketing/history', async (_req, res) => {
  try {
    const snap = await db.collection('marketing_history').orderBy('createdAt', 'desc').limit(20).get()
    const history = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// ============ SETTINGS ============
router.get('/settings', async (_req, res) => {
  try {
    const doc = await db.collection('settings').doc('global').get()
    if (!doc.exists) {
      // Return default settings if none exist
      const defaultSettings = {
        projectStatuses: ['Planning', 'Pre-production', 'Production', 'Post-production', 'Completed', 'On Hold'],
        projectTypes: ['Feature Film', 'Commercial', 'Documentary', 'Music Video', 'Corporate'],
        taskStatuses: ['To Do', 'In Progress', 'Completed'],
        equipmentTypes: ['Camera', 'Lighting', 'Audio', 'Other'],
        marketingContentTypes: ['social-post', 'email', 'blog', 'ad-copy', 'press-release', 'seo-description'],
      }
      res.json(defaultSettings)
    } else {
      res.json(doc.data())
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    await db.collection('settings').doc('global').set(req.body, { merge: true })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// ============ DOCUMENTS ============
router.get('/projects/:projectId/documents', async (req, res) => {
  try {
    const snap = await db.collection('projects').doc(req.params.projectId).collection('documents').orderBy('uploadedAt', 'desc').get()
    const documents = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.post('/projects/:projectId/documents', async (req, res) => {
  try {
    const user = (req as any).user
    const data = {
      ...req.body,
      uploadedBy: user.uid,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ref = await db.collection('projects').doc(req.params.projectId).collection('documents').add(data)
    res.json({ id: ref.id, ...data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document record' })
  }
})

router.delete('/projects/:projectId/documents/:documentId', async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.projectId).collection('documents').doc(req.params.documentId).get()
    const data = doc.data()

    // Delete from Storage
    if (data?.storagePath) {
      await admin.storage().bucket().file(data.storagePath).delete().catch(() => {})
    }

    // Delete document record
    await db.collection('projects').doc(req.params.projectId).collection('documents').doc(req.params.documentId).delete()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

// Mount the router under /api prefix
app.use('/api', router)

// Export Cloud Function
export const api = onRequest({ region: 'us-central1', invoker: 'public' }, app)

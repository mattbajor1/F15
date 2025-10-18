# Security Notes

## Environment Variables

All sensitive configuration is stored in `.env` files which are excluded from git.

### Setup Instructions

1. Copy the example environment file:
   ```bash
   cp frontend/.env.example frontend/.env.production
   ```

2. Fill in your Firebase configuration in `frontend/.env.production`:
   - Get these values from Firebase Console → Project Settings
   - These are client-side keys (safe to use in frontend)
   - Protected by Firebase Security Rules

3. Never commit `.env` files to git!

## Firebase API Keys

**Note:** Firebase client API keys (used in frontend) are designed to be public and are protected by:
- Firebase Security Rules (Firestore, Storage)
- Firebase Auth domain restrictions
- App Check (optional additional security)

However, backend secrets (like service account keys) must NEVER be committed.

## Backend Secrets

Backend secrets are stored in:
- **Firebase Functions Config** - Use `firebase functions:config:set`
- **Cloud Secret Manager** - For production secrets
- **Environment Variables** - In Cloud Run/Cloud Functions

### Current Secrets

- `GEMINI_API_KEY` - Stored in Firebase Runtime Config
  - Set via: `firebase functions:config:set gemini.api_key="YOUR_KEY"`
  - Access in code: `process.env.GEMINI_API_KEY`

## Firebase Service Account

The service account `889377556775-compute@developer.gserviceaccount.com` has these roles:
- Firebase Admin
- Service Usage Consumer
- Cloud Storage for Firebase Admin
- Artifact Registry Writer
- Logs Writer

Never commit service account JSON keys!

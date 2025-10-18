# Deployment Guide

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Gemini API key from Google AI Studio

## Setup Gemini API Key

The AI Marketing Assistant requires a Gemini API key. Follow these steps:

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Set the environment variable for Firebase Functions:

```bash
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"
```

3. For local development, the emulator will use a mock response if the key is not set, or you can set it locally:

```bash
# Windows
set GEMINI_API_KEY=your_api_key_here

# Mac/Linux
export GEMINI_API_KEY=your_api_key_here
```

## Pre-Deployment Checklist

1. **Build Frontend**:
```bash
cd frontend
npm run build
```

2. **Build Functions**:
```bash
cd functions
npm run build
```

3. **Test Locally**:
```bash
firebase emulators:start
```

## Deploy to Production

Deploy everything at once:

```bash
firebase deploy
```

Or deploy individual services:

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage
```

## Post-Deployment

1. Visit https://f15-internal.web.app
2. Sign in with your @frame15.com Google account
3. Verify all features are working:
   - Dashboard metrics
   - Projects CRUD
   - Inventory management
   - AI Marketing Assistant (requires API key)
   - Document uploads

## Environment Variables

### Frontend (.env.production)
- `VITE_FUNCTIONS_EMULATOR=false`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Backend (Firebase Functions Config)
- `gemini.api_key` - Set via `firebase functions:config:set`

Access in code:
```typescript
const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors in production, ensure:
1. Functions are deployed with the correct region (us-central1)
2. The rewrites in firebase.json are correct
3. Credentials are set to 'include' in production mode

### Authentication Issues
1. Ensure Google Sign-In is enabled in Firebase Console
2. Add your production domain to authorized domains
3. Verify @frame15.com domain restriction is working

### Storage Issues
1. Check storage.rules are deployed
2. Verify users have @frame15.com email addresses
3. Check Firebase Storage quotas

## Monitoring

- View logs: `firebase functions:log`
- Firebase Console: https://console.firebase.google.com/project/f15-internal
- Check quotas and usage in Firebase Console

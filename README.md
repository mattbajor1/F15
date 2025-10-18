# Frame 15 Internal Management System

A comprehensive internal management platform for Frame 15, built with React, TypeScript, Firebase, and AI-powered features.

## Features

### Core Management

#### Dashboard
- Real-time metrics overview
- Active projects count
- Open tasks tracking
- Equipment availability percentage
- Recent projects list with quick access

#### Project Management
- Create, read, update, delete projects
- Project details with 5 comprehensive tabs:
  - **Details**: Basic project information (name, status, client, description, dates, budget)
  - **Tasks**: Full task management with due dates, priorities, assignments, and completion tracking
  - **Equipment**: Assign and manage equipment from inventory to projects
  - **Marketing**: AI-generated marketing content library
  - **Invoicing**: Create and manage invoices with line items, discounts, tax calculations

#### Inventory Management
- Equipment tracking and management
- Status tracking: Available, In Use, Maintenance
- Type categorization: Camera, Lighting, Audio, Other
- Daily rate tracking
- Auto-update status when assigned to projects
- Stats dashboard with filtering by status

#### AI Marketing Assistant
- Generate marketing content with Google Gemini AI
- Support for multiple content types:
  - Social media posts
  - Email campaigns
  - Blog posts
  - Ad copy
  - Press releases
  - SEO descriptions
- Project-specific content generation
- Custom prompt support
- Generation history tracking
- Save content to projects
- Copy to clipboard functionality

#### Document Hub
- Firebase Storage integration
- Upload multiple files per project
- File type filtering: Images, Videos, Documents, Other
- Visual file previews with icons
- File size tracking and display
- Download links
- Delete functionality
- Total storage statistics

### Technical Features

#### Authentication
- Google Sign-In with Firebase Auth
- Domain restriction to @frame15.com emails
- Session cookies for production
- Auth state persistence
- Firebase emulator support for local development

#### Backend API
- Express.js on Firebase Functions v2
- RESTful API design
- Authentication middleware
- CORS configured for production and emulator
- Comprehensive error handling
- All CRUD operations for:
  - Projects
  - Tasks
  - Equipment assignments
  - Marketing content
  - Invoices
  - Inventory
  - Documents

#### Security
- Firestore security rules
- Storage security rules
- Company email verification (@frame15.com)
- Session-based authentication
- Protected API endpoints

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router v6
- Firebase SDK (Auth, Storage)

### Backend
- Firebase Functions v2
- Express.js
- Firebase Admin SDK
- Google Gemini AI API

### Database & Storage
- Cloud Firestore
- Firebase Storage
- Firebase Authentication

## Project Structure

```
f15-internal-starter/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components (Nav, Card)
│   │   ├── hooks/          # Custom hooks (useAuth)
│   │   ├── lib/            # Utilities (api, firebase)
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Marketing.tsx
│   │   │   └── Documents.tsx
│   │   ├── App.tsx
│   │   └── styles.css
│   ├── .env.local          # Local development config
│   ├── .env.production     # Production config
│   └── package.json
├── functions/              # Firebase Functions backend
│   ├── src/
│   │   └── index.ts        # Express API with all endpoints
│   └── package.json
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── storage.rules           # Storage security rules
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd f15-internal-starter
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../functions
npm install
```

3. Configure environment variables

Create `frontend/.env.local`:
```
VITE_FUNCTIONS_EMULATOR=true
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Set Gemini API key for local development (optional)
```bash
# Windows
set GEMINI_API_KEY=your_gemini_api_key

# Mac/Linux
export GEMINI_API_KEY=your_gemini_api_key
```

### Development

1. Start Firebase emulators
```bash
firebase emulators:start
```

2. In a new terminal, start the frontend dev server
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

The Firebase emulator UI will be available at http://localhost:4000

## Building for Production

1. Build frontend
```bash
cd frontend
npm run build
```

2. Build backend
```bash
cd functions
npm run build
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
```bash
# Set Gemini API key
firebase functions:config:set gemini.api_key="YOUR_API_KEY"

# Deploy everything
firebase deploy
```

## API Endpoints

### Authentication
- `POST /auth/sessionLogin` - Create session cookie
- `POST /auth/sessionLogout` - Clear session cookie
- `GET /health` - Health check (public)

### Dashboard
- `GET /dashboard/metrics` - Get dashboard statistics

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /projects/:projectId/tasks` - List tasks
- `POST /projects/:projectId/tasks` - Create task
- `PUT /projects/:projectId/tasks/:taskId` - Update task
- `DELETE /projects/:projectId/tasks/:taskId` - Delete task

### Equipment (Project Assignment)
- `GET /projects/:projectId/equipment` - List assigned equipment
- `POST /projects/:projectId/equipment` - Assign equipment
- `DELETE /projects/:projectId/equipment/:equipmentId` - Remove equipment

### Marketing
- `GET /projects/:projectId/marketing` - List marketing content
- `POST /projects/:projectId/marketing` - Save marketing content
- `PUT /projects/:projectId/marketing/:marketingId` - Update content
- `DELETE /projects/:projectId/marketing/:marketingId` - Delete content
- `POST /marketing/generate` - Generate AI content
- `GET /marketing/history` - Get generation history

### Invoices
- `GET /projects/:projectId/invoices` - List invoices
- `POST /projects/:projectId/invoices` - Create invoice
- `PUT /projects/:projectId/invoices/:invoiceId` - Update invoice
- `DELETE /projects/:projectId/invoices/:invoiceId` - Delete invoice

### Inventory
- `GET /inventory` - List all inventory items
- `POST /inventory` - Create inventory item
- `PUT /inventory/:id` - Update inventory item
- `DELETE /inventory/:id` - Delete inventory item

### Documents
- `GET /projects/:projectId/documents` - List documents
- `POST /projects/:projectId/documents` - Save document metadata
- `DELETE /projects/:projectId/documents/:documentId` - Delete document

## Environment Variables

### Frontend (.env files)
- `VITE_FUNCTIONS_EMULATOR` - Enable/disable emulator mode
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### Backend (Firebase Functions)
- `GEMINI_API_KEY` - Google Gemini API key (set via `firebase functions:config:set`)

## Firebase Emulators

When running locally with emulators:
- Auth Emulator: http://127.0.0.1:9099
- Firestore Emulator: http://127.0.0.1:8080
- Functions Emulator: http://127.0.0.1:5001
- Hosting Emulator: http://127.0.0.1:5000
- Storage Emulator: http://127.0.0.1:9199
- Emulator UI: http://localhost:4000

## Authentication Development Mode

In emulator mode, authentication is bypassed with a dev user:
- UID: `dev-user`
- Email: `dev@frame15.com`

This allows local development without requiring actual Google sign-in.

## Production URLs

- Web App: https://f15-internal.web.app
- Firebase Console: https://console.firebase.google.com/project/f15-internal

## License

Proprietary - Frame 15 Internal Use Only

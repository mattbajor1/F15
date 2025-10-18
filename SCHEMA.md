# Firestore Database Schema

## Collections

### 1. `projects`
Main project collection for all production projects.

```typescript
{
  id: string (auto-generated)
  name: string
  client: string
  type: string // "Feature Film", "Commercial", "Music Video", etc.
  status: "Planning" | "Pre-production" | "Production" | "Post-production" | "Complete"
  description: string
  photographyStart: timestamp
  photographyEnd: timestamp
  targetRelease: timestamp
  locations: string[] // Array of location names
  teamMembers: {
    uid: string
    name: string
    email: string
    role: string
    avatarUrl?: string
  }[]
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: string // uid
}
```

### 2. `projects/{projectId}/tasks`
Subcollection for project tasks.

```typescript
{
  id: string (auto-generated)
  title: string
  description?: string
  stage: "Pre-production" | "Production" | "Post-production"
  completed: boolean
  dueDate: timestamp
  assignedTo?: string // uid
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3. `projects/{projectId}/equipment`
Subcollection for equipment assigned to projects.

```typescript
{
  id: string (auto-generated)
  equipmentId: string // Reference to inventory item
  name: string // Denormalized for quick access
  type: string
  rentalPricePerDay: number
  assignedDate: timestamp
  returnDate?: timestamp
}
```

### 4. `projects/{projectId}/marketing`
Subcollection for marketing posts/campaigns.

```typescript
{
  id: string (auto-generated)
  copy: string
  imageUrl?: string
  platforms: string[] // ["Instagram", "Facebook", "Twitter", etc.]
  status: "Draft" | "Scheduled" | "Posted"
  scheduledFor?: timestamp
  postedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 5. `projects/{projectId}/invoices`
Subcollection for project invoices.

```typescript
{
  id: string (auto-generated)
  invoiceNumber: string
  date: timestamp
  dueDate: timestamp
  status: "Draft" | "Pending" | "Paid" | "Overdue"
  lineItems: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  subtotal: number
  discount: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 6. `inventory`
Global inventory/equipment collection.

```typescript
{
  id: string (auto-generated)
  name: string
  category: "Camera" | "Lens" | "Grip" | "Lighting" | "Audio" | "Props" | "Other"
  status: "Available" | "In Use" | "Maintenance"
  rentalPricePerDay: number
  purchaseDate?: timestamp
  maintenanceSchedule?: timestamp
  currentProject?: string // projectId if in use
  serialNumber?: string
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 7. `projects/{projectId}/documents`
Subcollection for document metadata (files stored in Firebase Storage).

```typescript
{
  id: string (auto-generated)
  name: string
  type: string // MIME type
  size: number // bytes
  storagePath: string // Firebase Storage path
  version: number
  uploadedBy: string // uid
  uploadedAt: timestamp
  permissions: {
    uid: string
    role: "viewer" | "editor" | "admin"
  }[]
}
```

### 8. `users`
User profiles (optional, for extended user data).

```typescript
{
  uid: string (matches Auth UID)
  email: string
  displayName: string
  avatarUrl?: string
  role: "Admin" | "Producer" | "Editor" | "Crew"
  createdAt: timestamp
  lastLogin: timestamp
}
```

## Indexes Required

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "stage", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { storage } from '../lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

interface Project {
  id: string
  name: string
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  storagePath: string
  projectId?: string
  projectName?: string
  uploadedAt: string
  uploadedBy: string
}

export default function Documents() {
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    loadProjects()
    loadAllDocuments()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await api('/projects')
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadAllDocuments = async () => {
    try {
      // Load documents from all projects
      const projectsData = await api('/projects')
      const allDocs: Document[] = []

      for (const project of projectsData) {
        const docs = await api(`/projects/${project.id}/documents`)
        allDocs.push(...docs.map((d: any) => ({ ...d, projectId: project.id, projectName: project.name })))
      }

      // Sort by upload date
      allDocs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      setDocuments(allDocs)
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!selectedProject) {
      alert('Please select a project first')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      for (const file of Array.from(files)) {
        // Create unique file path
        const timestamp = Date.now()
        const fileName = `${timestamp}-${file.name}`
        const storagePath = `projects/${selectedProject}/documents/${fileName}`

        // Upload to Firebase Storage
        const storageRef = ref(storage, storagePath)
        const uploadTask = uploadBytesResumable(storageRef, file)

        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              console.error('Upload error:', error)
              reject(error)
            },
            async () => {
              try {
                // Get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

                // Save document metadata to Firestore
                await api(`/projects/${selectedProject}/documents`, {
                  method: 'POST',
                  body: JSON.stringify({
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    url: downloadURL,
                    storagePath,
                  }),
                })

                resolve()
              } catch (err) {
                reject(err)
              }
            }
          )
        })
      }

      alert('Files uploaded successfully!')
      e.target.value = '' // Reset input
      await loadAllDocuments()
    } catch (err) {
      console.error('Failed to upload files:', err)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"?`)) return

    try {
      await api(`/projects/${doc.projectId}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      await loadAllDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Failed to delete document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📁'
  }

  const fileTypes = ['All', 'Images', 'Videos', 'Documents', 'Other']

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'All') return true
    if (filter === 'Images') return doc.type.startsWith('image/')
    if (filter === 'Videos') return doc.type.startsWith('video/')
    if (filter === 'Documents') return doc.type.includes('pdf') || doc.type.includes('document') || doc.type.includes('word') || doc.type.includes('sheet') || doc.type.includes('presentation')
    if (filter === 'Other') return !doc.type.startsWith('image/') && !doc.type.startsWith('video/') && !doc.type.includes('pdf') && !doc.type.includes('document')
    return true
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Document Hub</h1>

        <div className="flex items-center gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading || !selectedProject}
            />
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Files'}
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Documents</div>
          <div className="text-2xl font-bold">{documents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Images</div>
          <div className="text-2xl font-bold">
            {documents.filter(d => d.type.startsWith('image/')).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Videos</div>
          <div className="text-2xl font-bold">
            {documents.filter(d => d.type.startsWith('video/')).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Size</div>
          <div className="text-2xl font-bold">
            {formatFileSize(documents.reduce((sum, d) => sum + d.size, 0))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {fileTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-md ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">No documents yet</div>
          <div className="text-gray-500 text-sm">
            Select a project and upload files to get started
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-3xl">{getFileIcon(doc.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate" title={doc.name}>
                      {doc.name}
                    </div>
                    <div className="text-xs text-gray-500">{formatFileSize(doc.size)}</div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDocument(doc)}
                  className="text-red-600 hover:text-red-800 ml-2"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>

              {doc.projectName && (
                <div className="text-xs text-gray-600 mb-2 bg-gray-100 px-2 py-1 rounded">
                  📁 {doc.projectName}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Open →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
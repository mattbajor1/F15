import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Link, useSearchParams } from 'react-router-dom'

interface Project {
  id: string
  name: string
  client: string
  type?: string
  status: string
  description?: string
  dueDate?: any
  updatedAt?: any
}

export default function Projects() {
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const showModal = searchParams.get('new') === 'true'

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await api('/projects')
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setSearchParams({ new: 'true' })
  }

  function closeModal() {
    setSearchParams({})
  }

  async function handleCreate(project: Partial<Project>) {
    try {
      await api('/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      })
      closeModal()
      loadProjects()
    } catch (e) {
      console.error('Failed to create project:', e)
      alert('Failed to create project')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-slate-400 mt-1">Manage all your production projects</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors"
        >
          + New Project
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl h-40 bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6">Create your first project to get started</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors"
          >
            + Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={closeModal} onCreate={handleCreate} />}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    Planning: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Pre-production': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Production: 'bg-green-500/20 text-green-300 border-green-500/30',
    'Post-production': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Complete: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  const statusClass = statusColors[project.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-5 hover:border-slate-700 transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate group-hover:text-brand transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-slate-400 truncate">{project.client}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusClass}`}>
          {project.status}
        </span>
        {project.type && (
          <span className="px-2 py-1 rounded-md text-xs bg-slate-800 text-slate-300">
            {project.type}
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>View Details →</span>
      </div>
    </Link>
  )
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (project: Partial<Project>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    type: 'Feature Film',
    status: 'Planning',
    description: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.client) {
      alert('Please fill in required fields')
      return
    }
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Create New Project</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-brand focus:outline-none"
              placeholder="e.g., Dusk Till Dawn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Client <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={e => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-brand focus:outline-none"
              placeholder="e.g., Noir Pictures"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-brand focus:outline-none"
              >
                <option>Feature Film</option>
                <option>Commercial</option>
                <option>Music Video</option>
                <option>Documentary</option>
                <option>Short Film</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-brand focus:outline-none"
              >
                <option>Planning</option>
                <option>Pre-production</option>
                <option>Production</option>
                <option>Post-production</option>
                <option>Complete</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-brand focus:outline-none"
              rows={3}
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

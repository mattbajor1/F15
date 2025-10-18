import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface DashboardMetrics {
  activeProjects: number
  openTasks: number
  availableEquipment: number
  recentProjects: Array<{
    id: string
    name: string
    client: string
    status: string
    updatedAt?: any
  }>
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/dashboard/metrics')
        setMetrics(data)
      } catch (e) {
        console.error('Failed to fetch dashboard metrics:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening with your projects.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Active Projects"
          value={metrics?.activeProjects ?? 0}
          icon="🎬"
        />
        <MetricCard
          label="Open Tasks"
          value={metrics?.openTasks ?? 0}
          icon="✓"
        />
        <MetricCard
          label="Available Equipment"
          value={`${metrics?.availableEquipment ?? 0}%`}
          icon="📦"
        />
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link
            to="/projects"
            className="text-sm text-brand hover:text-brand/80 transition-colors"
          >
            View all →
          </Link>
        </div>

        {metrics?.recentProjects && metrics.recentProjects.length > 0 ? (
          <div className="space-y-3">
            {metrics.recentProjects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{project.name}</div>
                    <div className="text-sm text-slate-400">{project.client}</div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-2">📋</div>
            <div>No projects yet</div>
            <Link to="/projects" className="text-brand hover:underline mt-2 inline-block">
              Create your first project
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <QuickAction
          title="New Project"
          description="Start a new production"
          icon="➕"
          to="/projects?new=true"
        />
        <QuickAction
          title="Manage Inventory"
          description="Track equipment & props"
          icon="📦"
          to="/inventory"
        />
        <QuickAction
          title="View Reports"
          description="Analytics & insights"
          icon="📊"
          to="/reports"
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-slate-400 text-sm">{label}</div>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Planning: 'bg-blue-500/20 text-blue-300',
    'Pre-production': 'bg-yellow-500/20 text-yellow-300',
    Production: 'bg-green-500/20 text-green-300',
    'Post-production': 'bg-purple-500/20 text-purple-300',
    Complete: 'bg-slate-500/20 text-slate-300',
  }
  const colorClass = colors[status] || 'bg-slate-500/20 text-slate-300'

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}

function QuickAction({ title, description, icon, to }: { title: string; description: string; icon: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-card p-4 hover:border-slate-700 transition-colors"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-slate-400">{description}</div>
    </Link>
  )
}

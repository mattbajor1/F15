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
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-16 w-16" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-400 text-lg">
            Welcome back! Here's what's happening with your Frame 15 productions.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-3 gap-6 animate-slide-in-up">
          <MetricCard
            label="Active Projects"
            value={metrics?.activeProjects ?? 0}
            icon="🎬"
            color="indigo"
          />
          <MetricCard
            label="Open Tasks"
            value={metrics?.openTasks ?? 0}
            icon="✅"
            color="purple"
          />
          <MetricCard
            label="Available Equipment"
            value={`${metrics?.availableEquipment ?? 0}%`}
            icon="📦"
            color="pink"
          />
        </div>

        {/* Recent Projects */}
        <div className="card animate-slide-in-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gradient-purple">Recent Projects</h2>
              <Link
                to="/projects"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-2 group"
              >
                <span>View all</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {metrics?.recentProjects && metrics.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg group-hover:text-indigo-300 transition-colors">
                          {project.name}
                        </div>
                        <div className="text-sm text-slate-400">{project.client}</div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-6xl mb-4 opacity-50">🎬</div>
                <div className="text-lg mb-2">No projects yet</div>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 mt-4 btn-primary"
                >
                  <span>Create your first project</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-6 animate-slide-in-up">
          <QuickAction
            title="New Project"
            description="Start a new production"
            icon="➕"
            to="/projects?new=true"
            gradient="from-indigo-500/10 to-purple-500/10"
            hoverGradient="from-indigo-500/20 to-purple-500/20"
            borderColor="border-indigo-500/30"
            textColor="text-indigo-300"
          />
          <QuickAction
            title="Manage Inventory"
            description="Track equipment & props"
            icon="📦"
            to="/inventory"
            gradient="from-pink-500/10 to-rose-500/10"
            hoverGradient="from-pink-500/20 to-rose-500/20"
            borderColor="border-pink-500/30"
            textColor="text-pink-300"
          />
          <QuickAction
            title="AI Marketing"
            description="Generate content with AI"
            icon="✨"
            to="/marketing"
            gradient="from-purple-500/10 to-pink-500/10"
            hoverGradient="from-purple-500/20 to-pink-500/20"
            borderColor="border-purple-500/30"
            textColor="text-purple-300"
          />
        </div>

        {/* Pro Tip Banner */}
        <div className="card bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30 animate-fade-in">
          <div className="p-6 flex items-center gap-4">
            <div className="text-4xl animate-pulse-glow">💡</div>
            <div>
              <h3 className="font-semibold text-lg text-indigo-300 mb-1">Pro Tip</h3>
              <p className="text-slate-300">
                Use the AI Marketing tool to generate professional marketing content for your projects with
                customizable tone and length options!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: string
  color: 'indigo' | 'purple' | 'pink'
}) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-300',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-300',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-400 text-sm font-medium mb-2">{label}</div>
          <div className="text-4xl font-bold text-gradient">{value}</div>
        </div>
        <div
          className={`text-4xl bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl border transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Planning: 'badge badge-primary',
    'Pre-production': 'badge badge-warning',
    Production: 'badge badge-success',
    'Post-production': 'badge badge-primary',
    Complete: 'bg-slate-500/20 text-slate-300 border border-slate-500/30 px-3 py-1 rounded-full text-xs font-medium',
  }
  const className = colors[status] || 'badge'

  return <span className={className}>{status}</span>
}

function QuickAction({
  title,
  description,
  icon,
  to,
  gradient,
  hoverGradient,
  borderColor,
  textColor,
}: {
  title: string
  description: string
  icon: string
  to: string
  gradient: string
  hoverGradient: string
  borderColor: string
  textColor: string
}) {
  return (
    <Link
      to={to}
      className={`
        group relative overflow-hidden
        bg-gradient-to-br ${gradient} hover:${hoverGradient}
        border ${borderColor}
        rounded-xl p-6
        transition-all duration-300
        hover:scale-105 hover:shadow-xl
      `}
    >
      <div className={`absolute top-0 right-0 text-6xl opacity-10 group-hover:opacity-20 transition-opacity`}>
        {icon}
      </div>
      <div className="relative">
        <div className="text-3xl mb-3">{icon}</div>
        <div className={`font-semibold text-lg ${textColor} mb-1`}>{title}</div>
        <div className="text-slate-400 text-sm">{description}</div>
      </div>
    </Link>
  )
}

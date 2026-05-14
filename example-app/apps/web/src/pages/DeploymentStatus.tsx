import { useEffect, useState } from 'react'
import { getDeploymentStatus, getHealth, type DeploymentInfo, type HealthInfo } from '@/api/client'

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}h ${m}m ${s}s`
}

function statusColor(status: string): string {
  if (status === 'healthy' || status === 'ok') return 'text-green-600'
  if (status === 'degraded') return 'text-yellow-600'
  return 'text-red-600'
}

function statusDot(status: string): string {
  if (status === 'healthy' || status === 'ok') return 'bg-green-500'
  if (status === 'degraded') return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function DeploymentStatus() {
  const [deploy, setDeploy] = useState<DeploymentInfo | null>(null)
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [deployRes, healthRes] = await Promise.all([
          getDeploymentStatus(),
          getHealth(),
        ])
        setDeploy(deployRes)
        setHealth(healthRes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deployment status')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Deployment Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Application</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-800 font-medium">{deploy?.version || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Commit</span>
              <span className="text-gray-800 font-mono text-xs">{deploy?.commitSha ? deploy.commitSha.slice(0, 8) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Environment</span>
              <span className="text-gray-800 capitalize">{deploy?.environment || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uptime</span>
              <span className="text-gray-800">{deploy ? formatUptime(deploy.uptime) : '—'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Health Status</p>
          {health && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusDot(health.status)}`} />
                <span className={`text-sm font-medium ${statusColor(health.status)}`}>
                  {health.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Uptime: {formatUptime(health.uptime)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Service Status</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Database</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot(deploy?.dbStatus || 'unknown')}`} />
              <span className={`text-sm font-medium ${statusColor(deploy?.dbStatus || 'unknown')}`}>
                {deploy?.dbStatus || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Redis</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot(deploy?.redisStatus || 'unknown')}`} />
              <span className={`text-sm font-medium ${statusColor(deploy?.redisStatus || 'unknown')}`}>
                {deploy?.redisStatus || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

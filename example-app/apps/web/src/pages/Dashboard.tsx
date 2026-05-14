import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import { getLeads, getChecklists, getDeploymentStatus, type Lead, type ChecklistTemplate, type DeploymentInfo } from '@/api/client'

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [deploy, setDeploy] = useState<DeploymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, checklistRes, deployRes] = await Promise.all([
          getLeads(),
          getChecklists(),
          getDeploymentStatus(),
        ])
        setLeads(leadsRes.leads)
        setTemplates(checklistRes.templates)
        setDeploy(deployRes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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

  const totalLeads = leads.length
  const highFit = leads.filter((l) => l.fitScore !== null && l.fitScore >= 60).length
  const applied = leads.filter((l) => l.status === 'applied').length

  let checklistWarnings = 0
  for (const t of templates) {
    for (const item of t.items) {
      if (item.status === 'warning' || item.status === 'fail') {
        checklistWarnings++
      }
    }
  }

  const deployStatusColor = deploy?.dbStatus === 'healthy' && deploy?.redisStatus === 'healthy'
    ? 'text-green-600'
    : 'text-yellow-600'

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Leads" value={totalLeads} />
        <StatCard title="High-Fit Leads" value={highFit} color="text-green-600" />
        <StatCard title="Leads Applied" value={applied} />
        <StatCard
          title="Checklist Issues"
          value={checklistWarnings}
          color={checklistWarnings > 0 ? 'text-yellow-600' : 'text-green-600'}
          subtitle={checklistWarnings > 0 ? 'Warnings or failures' : 'All clear'}
        />
        {deploy && (
          <StatCard
            title="Deployment"
            value={deploy.environment}
            subtitle={`v${deploy.version}`}
            color={deployStatusColor}
          />
        )}
      </div>
    </div>
  )
}

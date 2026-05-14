import { useEffect, useState, FormEvent } from 'react'
import LeadTable from '@/components/LeadTable'
import {
  getLeads,
  createLead,
  updateLead,
  scoreLead,
  type Lead,
  type ScoreResult,
} from '@/api/client'

const statusOptions = ['', 'new', 'reviewed', 'contacted', 'applied', 'rejected', 'archived']
const sourceOptions = ['', 'upwork', 'freelancer', 'linkedin', 'referral', 'direct', 'other']

const emptyForm: Partial<Lead> = {
  title: '',
  source: 'upwork',
  budgetText: '',
  stackText: '',
  description: '',
  status: 'new',
  redFlags: '',
  notes: '',
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoring, setScoring] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function fetchLeads() {
    try {
      const res = await getLeads({
        status: filterStatus || undefined,
        source: filterSource || undefined,
        search: filterSearch || undefined,
      })
      setLeads(res.leads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [filterStatus, filterSource, filterSearch])

  function openCreate() {
    setForm(emptyForm)
    setEditLead(null)
    setShowCreate(true)
  }

  function openEdit(lead: Lead) {
    setForm({
      title: lead.title,
      source: lead.source,
      budgetText: lead.budgetText,
      stackText: lead.stackText,
      description: lead.description,
      status: lead.status,
      redFlags: lead.redFlags || '',
      notes: lead.notes,
    })
    setEditLead(lead)
    setShowCreate(true)
  }

  function openView(lead: Lead) {
    setViewLead(lead)
    setScoreResult(null)
  }

  async function handleScore(id: string) {
    setScoring(true)
    try {
      const result = await scoreLead(id)
      setScoreResult(result)
      const lead = leads.find((l) => l.id === id)
      if (lead) setViewLead(lead)
      fetchLeads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        redFlags: typeof form.redFlags === 'string' ? form.redFlags : '',
      }
      if (editLead) {
        await updateLead(editLead.id, payload)
      } else {
        await createLead(payload)
      }
      setShowCreate(false)
      setEditLead(null)
      fetchLeads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function closeView() {
    setViewLead(null)
    setScoreResult(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Leads</h2>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Lead
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          {statusOptions.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All sources</option>
          {sourceOptions.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <LeadTable
            leads={leads}
            onScore={handleScore}
            onEdit={openEdit}
            onView={openView}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editLead ? 'Edit Lead' : 'Create Lead'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sourceOptions.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Budget</label>
                <input
                  value={form.budgetText}
                  onChange={(e) => setForm({ ...form, budgetText: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. $5k-10k"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stack</label>
                <input
                  value={form.stackText}
                  onChange={(e) => setForm({ ...form, stackText: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. React, Node, Postgres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Red Flags (comma separated)</label>
                <input
                  value={typeof form.redFlags === 'string' ? form.redFlags : ''}
                  onChange={(e) => setForm({ ...form, redFlags: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. vague scope, low budget"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-sm text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Score Detail Panel */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">{viewLead.title}</h3>
              <button onClick={closeView} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <span className="text-gray-800">{viewLead.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Budget</span>
                <span className="text-gray-800">{viewLead.budgetText || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-gray-800 capitalize">{viewLead.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fit Score</span>
                <span className="font-medium">{viewLead.fitScore !== null ? viewLead.fitScore : 'Not scored'}</span>
              </div>
              {viewLead.stackText && (
                <div>
                  <span className="text-gray-500 block">Stack</span>
                  <span className="text-gray-800">{viewLead.stackText}</span>
                </div>
              )}
              {viewLead.description && (
                <div>
                  <span className="text-gray-500 block">Description</span>
                  <p className="text-gray-800">{viewLead.description}</p>
                </div>
              )}
              {viewLead.redFlags && viewLead.redFlags.length > 0 && (
                <div>
                  <span className="text-gray-500 block">Red Flags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewLead.redFlags.split(',').map((f, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {viewLead.notes && (
                <div>
                  <span className="text-gray-500 block">Notes</span>
                  <p className="text-gray-800">{viewLead.notes}</p>
                </div>
              )}
            </div>

            {/* Score result */}
            {scoreResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Scoring Result</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">{scoreResult.score}</p>
                {scoreResult.reasons.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Reasons</p>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      {scoreResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {scoreResult.redFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Detected Red Flags</p>
                    <div className="flex flex-wrap gap-1">
                      {scoreResult.redFlags.map((f, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => { handleScore(viewLead.id); setViewLead(viewLead) }}
                disabled={scoring}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {scoring ? 'Scoring...' : 'Score Lead'}
              </button>
              <button
                onClick={closeView}
                className="text-sm text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

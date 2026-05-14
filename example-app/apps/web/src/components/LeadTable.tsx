import type { Lead } from '@/api/client'

interface LeadTableProps {
  leads: Lead[]
  onScore: (id: string) => void
  onEdit: (lead: Lead) => void
  onView: (lead: Lead) => void
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 60) return 'text-green-600'
  if (score >= 30) return 'text-yellow-600'
  return 'text-red-600'
}

export default function LeadTable({ leads, onScore, onEdit, onView }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No leads found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 pr-4 font-medium">Title</th>
            <th className="pb-3 pr-4 font-medium">Source</th>
            <th className="pb-3 pr-4 font-medium">Budget</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Score</th>
            <th className="pb-3 pr-4 font-medium">Red Flags</th>
            <th className="pb-3 pr-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <button
                  onClick={() => onView(lead)}
                  className="text-blue-600 hover:underline text-left"
                >
                  {lead.title}
                </button>
              </td>
              <td className="py-3 pr-4 text-gray-600">{lead.source}</td>
              <td className="py-3 pr-4 text-gray-600">{lead.budgetText || '—'}</td>
              <td className="py-3 pr-4">
                <span className="capitalize text-gray-600">{lead.status}</span>
              </td>
              <td className={`py-3 pr-4 font-medium ${scoreColor(lead.fitScore)}`}>
                {lead.fitScore !== null ? lead.fitScore : '—'}
              </td>
              <td className="py-3 pr-4">
                {lead.redFlags && lead.redFlags.trim().length > 0 ? (
                  <span className="text-red-600 text-xs">{lead.redFlags.split(',').filter(Boolean).length} flag(s)</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onScore(lead.id)}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    Score
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

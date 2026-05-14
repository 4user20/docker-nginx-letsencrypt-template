import type { ChecklistTemplate, ChecklistItem } from '@/api/client'
import { updateChecklistItem } from '@/api/client'

interface ChecklistBoardProps {
  templates: ChecklistTemplate[]
  onUpdate: () => void
}

const statusColors: Record<string, string> = {
  pass: 'bg-green-500',
  warning: 'bg-yellow-500',
  fail: 'bg-red-500',
  not_checked: 'bg-gray-300',
}

const statusLabels: Record<string, string> = {
  pass: 'Pass',
  warning: 'Warning',
  fail: 'Fail',
  not_checked: 'Not Checked',
}

const nextStatus: Record<string, string> = {
  not_checked: 'pass',
  pass: 'warning',
  warning: 'fail',
  fail: 'not_checked',
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50'
    case 'high': return 'text-orange-600 bg-orange-50'
    case 'medium': return 'text-yellow-600 bg-yellow-50'
    default: return 'text-blue-600 bg-blue-50'
  }
}

async function handleToggle(item: ChecklistItem, onUpdate: () => void) {
  const newStatus = nextStatus[item.status] || 'not_checked'
  try {
    await updateChecklistItem({ itemId: item.id, status: newStatus, evidence: '' })
    onUpdate()
  } catch {
    // silently fail, could surface error in future
  }
}

export default function ChecklistBoard({ templates, onUpdate }: ChecklistBoardProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No checklist templates found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {templates.map((template) => (
        <div key={template.id}>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
            )}
          </div>
          <div className="space-y-2">
            {template.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3 cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => handleToggle(item, onUpdate)}
              >
                <div className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${statusColors[item.status] || statusColors.not_checked}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{item.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {statusLabels[item.status] || 'Not Checked'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

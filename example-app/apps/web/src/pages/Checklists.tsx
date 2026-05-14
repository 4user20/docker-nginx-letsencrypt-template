import { useEffect, useState } from 'react'
import ChecklistBoard from '@/components/ChecklistBoard'
import { getChecklists, type ChecklistTemplate } from '@/api/client'

export default function Checklists() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')

  async function fetchTemplates() {
    try {
      const res = await getChecklists()
      setTemplates(res.templates)
      if (!activeCategory && res.templates.length > 0) {
        setActiveCategory(res.templates[0].category)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const categories = [...new Set(templates.map((t) => t.category))]
  const filtered = templates.filter((t) => t.category === activeCategory)

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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">DevSecOps Checklists</h2>

      {categories.length > 1 && (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-sm px-4 py-2 border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <ChecklistBoard templates={filtered} onUpdate={fetchTemplates} />
    </div>
  )
}

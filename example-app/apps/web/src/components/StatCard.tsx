interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
}

export default function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const valueColor = color || 'text-gray-900'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

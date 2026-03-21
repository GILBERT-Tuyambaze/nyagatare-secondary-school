import { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export type SuperAdminStat = {
  label: string
  value: string | number
  tone: 'good' | 'warn' | 'neutral'
  to: string
  detail: string
  icon: LucideIcon
}

export function SuperAdminStatsGrid({ items }: { items: SuperAdminStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        const toneClasses =
          item.tone === 'good'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
            : item.tone === 'warn'
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-100'
              : 'border-slate-700 bg-slate-900/85 text-white'

        return (
          <Link
            key={item.label}
            to={item.to}
            className={`group flex min-h-[184px] flex-col rounded-3xl border p-5 transition-colors hover:border-cyan-400/40 ${toneClasses}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium opacity-80">{item.label}</p>
                <p className="mt-3 break-words text-3xl font-bold leading-tight">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-black/10 p-3 transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 opacity-80">{item.detail}</p>
          </Link>
        )
      })}
    </div>
  )
}

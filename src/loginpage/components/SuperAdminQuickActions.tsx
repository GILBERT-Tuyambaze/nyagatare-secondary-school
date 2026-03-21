import { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

export type SuperAdminQuickAction = {
  label: string
  to: string
  icon: LucideIcon
  detail: string
}

export function SuperAdminQuickActions({ actions }: { actions: SuperAdminQuickAction[] }) {
  return (
    <Card title="Quick Actions" description="Fast entry into the workflows a SuperAdmin uses most often.">
      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.to}
              className="rounded-3xl border border-slate-700 bg-slate-900/85 p-4 transition-colors hover:border-cyan-400/30"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{action.label}</p>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-300">{action.detail}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

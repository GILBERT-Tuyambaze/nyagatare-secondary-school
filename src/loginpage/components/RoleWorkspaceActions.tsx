import { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

export type RoleWorkspaceAction = {
  label: string
  detail: string
  to: string
  icon: LucideIcon
}

export function RoleWorkspaceActions({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions: RoleWorkspaceAction[]
}) {
  return (
    <Card title={title} description={description}>
      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-white transition-colors hover:border-cyan-400/30"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{action.detail}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

import { LucideIcon } from 'lucide-react'
import { Card } from './Card'

export type RoleWorkspaceStat = {
  label: string
  value: string | number
  note: string
  icon: LucideIcon
}

export function RoleWorkspaceStats({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: RoleWorkspaceStat[]
}) {
  return (
    <Card title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.note}</p>
                </div>
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

import { Link } from 'react-router-dom'
import { Card } from './Card'

export type RoleWorkspaceListItem = {
  id: string
  title: string
  detail: string
  to: string
  badge?: string
}

export function RoleWorkspaceList({
  title,
  description,
  emptyMessage,
  items,
}: {
  title: string
  description: string
  emptyMessage: string
  items: RoleWorkspaceListItem[]
}) {
  return (
    <Card title={title} description={description}>
      <div className="space-y-3">
        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : null}
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="block rounded-3xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-white">{item.title}</p>
              {item.badge ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">{item.badge}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
          </Link>
        ))}
      </div>
    </Card>
  )
}

import { Link } from 'react-router-dom'
import { Card } from './Card'

export type SuperAdminActivityItem = {
  id: string
  label: string
  note: string
  at: string
  to?: string
}

export function SuperAdminRecentActivity({ items }: { items: SuperAdminActivityItem[] }) {
  return (
    <Card title="Recent Activity" description="Latest accountable actions across admissions, invitations, content, and calendar work.">
      <div className="space-y-3">
        {items.length ? (
          items.map((activity) => (
            <Link
              key={activity.id}
              to={activity.to || '/system'}
              className="block rounded-3xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-cyan-400/30"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{activity.label}</p>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-300">{activity.note}</p>
                </div>
                <p className="shrink-0 text-xs text-slate-400">{new Date(activity.at).toLocaleString()}</p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-slate-300">No recent activity is available yet.</p>
        )}
      </div>
    </Card>
  )
}

import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

export type SuperAdminAlertItem = {
  id: string
  text: string
  to: string
}

export function SuperAdminAlerts({ alerts }: { alerts: SuperAdminAlertItem[] }) {
  return (
    <Card title="SuperAdmin Alerts" description="High-signal operational warnings and status checks from the live modules you already use.">
      <div className="space-y-3">
        {alerts.length ? (
          alerts.map((alert) => (
            <Link
              key={alert.id}
              to={alert.to}
              className="flex items-start justify-between gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100 transition-colors hover:border-amber-400/40"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{alert.text}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            No urgent warnings are showing from the connected modules right now.
          </div>
        )}
      </div>
    </Card>
  )
}

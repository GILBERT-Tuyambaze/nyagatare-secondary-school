import { Badge } from '@/components/ui/badge'
import { Card } from '../components/Card'
import { controlStats } from '../lib/db'
import { systemUsers } from '../lib/db'

export default function ControlCenterPage() {
  return (
    <div className="space-y-6">
      <Card title="Staff/Admin Control Center" description="Operational command space for school leadership, staff, and administrators.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {controlStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-300">{stat.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Command Team Snapshot" description="People currently modeled in the secure operations structure.">
        <div className="grid gap-4 md:grid-cols-2">
          {systemUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-400">{user.department}</p>
                </div>
                <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{user.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

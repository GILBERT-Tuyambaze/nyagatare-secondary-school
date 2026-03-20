import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '../components/Card'
import { roleDefinitions } from '../lib/rbac'

export default function SystemIndexPage() {
  const { accessProfile } = useAuth()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Current Role">
          <p className="text-3xl font-bold text-cyan-100">{accessProfile.role}</p>
          <p className="mt-2 text-sm text-slate-300">Resolved from the authenticated account and RBAC mapping.</p>
        </Card>
        <Card title="Permission Count">
          <p className="text-3xl font-bold text-cyan-100">{accessProfile.permissions.length}</p>
          <p className="mt-2 text-sm text-slate-300">Permissions currently attached to your session.</p>
        </Card>
        <Card title="Available Roles">
          <p className="text-3xl font-bold text-cyan-100">{roleDefinitions.length}</p>
          <p className="mt-2 text-sm text-slate-300">Predefined roles already modeled for the platform.</p>
        </Card>
      </div>

      <Card title="Your Permission Map" description="Everything the current role can access in the secure system.">
        <div className="flex flex-wrap gap-2">
          {accessProfile.permissions.length ? (
            accessProfile.permissions.map((permission) => (
              <Badge key={permission} className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                {permission}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-slate-300">This role has no elevated permissions yet.</p>
          )}
        </div>
      </Card>

      <Card title="System Modules" description="Direct entry points into the new role-aware workspace.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Student Dashboard', to: '/system/student-dashboard', detail: 'Progress, tasks, and learner visibility.' },
            { label: 'Control Center', to: '/system/control-center', detail: 'Operations, team visibility, and leadership signals.' },
            { label: 'AI Hub', to: '/system/ai-hub', detail: 'Chat-based support and analytics-driven insights.' },
            { label: 'Roles', to: '/system/roles', detail: 'RBAC definitions and access coverage.' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4 text-white transition-colors hover:border-cyan-400/30">
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

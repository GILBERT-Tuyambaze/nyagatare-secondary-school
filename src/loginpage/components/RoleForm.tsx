import { Badge } from '@/components/ui/badge'
import { RoleDefinition } from '../types'
import { Card } from './Card'

export function RoleForm({ roles }: { roles: RoleDefinition[] }) {
  return (
    <Card title="Roles & Permissions" description="Every role currently modeled in the RBAC core.">
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.role} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{role.role}</h3>
                <p className="mt-1 text-sm text-slate-400">{role.description}</p>
              </div>
              <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                {role.permissions.length} permissions
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.permissions.length ? (
                role.permissions.map((permission) => (
                  <Badge key={permission} className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                    {permission}
                  </Badge>
                ))
              ) : (
                <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-800">No elevated permissions</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

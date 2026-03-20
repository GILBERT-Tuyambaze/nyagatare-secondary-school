import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { AccessProfile } from '../types'

export function Topbar({
  profile,
  title,
  description,
  onSignOut,
}: {
  profile: AccessProfile
  title: string
  description: string
  onSignOut: () => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-700 bg-slate-950/85 px-6 py-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Secure Workspace</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">
          {profile.permissions.length} permissions
        </Badge>
        <Badge className="bg-white/10 text-white hover:bg-white/10">{profile.role}</Badge>
        <Button
          variant="outline"
          className="border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

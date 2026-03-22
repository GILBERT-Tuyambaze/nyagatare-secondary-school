import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NavLink } from 'react-router-dom'
import { getSidebarSystemNav } from '../lib/systemNavigation'
import { AccessProfile } from '../types'

export function Sidebar({ profile }: { profile: AccessProfile }) {
  return (
    <aside className="w-full border-b border-slate-800 bg-slate-950/95 p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">NSS Digital System</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Role-Aware Workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Secure school operations, class management, and role-based tools in one responsive workspace.</p>
      </div>

      <div className="mb-6 rounded-3xl border border-cyan-400/25 bg-cyan-500/12 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Signed In As</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-white">{profile.displayName}</span>
          <Badge className="bg-cyan-200 text-slate-950 hover:bg-cyan-200">{profile.role}</Badge>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI Assistant</p>
        <p className="mt-2 text-base font-semibold text-white">GILBERT</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">GILBERT is the public website assistant. Use the sidebar to review it here, while the header AI Hub stays focused on internal system intelligence.</p>
      </div>

      <nav className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
        {getSidebarSystemNav(profile).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/system'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors',
                    isActive
                      ? 'bg-cyan-500/12 text-cyan-100'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
      </nav>
    </aside>
  )
}

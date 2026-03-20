import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const modules = [
  {
    title: 'Smart Admissions',
    description: 'Review applications, track status changes, and coordinate approvals with a faster digital workflow.',
    icon: GraduationCap,
    status: 'Live',
  },
  {
    title: 'AI Insights',
    description: 'Surface trends from student and school activity so staff can make better decisions quickly.',
    icon: BrainCircuit,
    status: 'Beta',
  },
  {
    title: 'Security Center',
    description: 'Monitor account access, trusted users, and key protection signals for the platform.',
    icon: ShieldCheck,
    status: 'Protected',
  },
  {
    title: 'Realtime Monitoring',
    description: 'Keep an eye on updates across events, board content, and application movement in one place.',
    icon: Radar,
    status: 'Active',
  },
]

const metrics = [
  { label: 'System Uptime', value: '99.98%' },
  { label: 'Active Sessions', value: '128' },
  { label: 'Protected Records', value: '12.4K' },
  { label: 'Automation Tasks', value: '37' },
]

export default function HighTechSystem() {
  const { user, signOut, isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_38%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-cyan-400/20 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Badge className="bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/20">NSS DIGITAL CORE</Badge>
              <Badge className="bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/20">Secure Access</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">High-Tech System</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              A modern control center for school operations, protected access, smart workflows, and connected decision-making.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Open Admin
                </Button>
              </Link>
            )}
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-white/10 bg-white/5 text-white shadow-2xl shadow-cyan-950/20">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-bold text-cyan-200">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-cyan-300" />
                  Intelligent Modules
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Explore the digital systems available after secure login.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {modules.map((module) => {
                  const Icon = module.icon
                  return (
                    <div key={module.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 transition-colors hover:border-cyan-300/30 hover:bg-slate-950/60">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-2xl bg-cyan-400/10 p-3">
                          <Icon className="h-6 w-6 text-cyan-300" />
                        </div>
                        <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{module.status}</Badge>
                      </div>
                      <h2 className="text-xl font-semibold">{module.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{module.description}</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Activity className="h-6 w-6 text-emerald-300" />
                  Live Command Feed
                </CardTitle>
                <CardDescription className="text-slate-300">
                  A quick snapshot of what the connected platform is doing right now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm text-emerald-200">Enrollment pipeline synced successfully.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="text-sm text-cyan-100">Board member data cache refreshed for public website display.</p>
                </div>
                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
                  <p className="text-sm text-fuchsia-100">AI guidance engine prepared the next review batch for staff.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Fingerprint className="h-5 w-5 text-cyan-300" />
                  Access Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-slate-400">Signed in as</p>
                  <p className="mt-1 font-medium text-white">{user?.email ?? 'Unknown user'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Access level</p>
                  <p className="mt-1 font-medium text-white">{isAdmin ? 'Administrator' : 'Authenticated User'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Security state</p>
                  <p className="mt-1 font-medium text-emerald-300">Verified session</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  Smart Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/student-portal" className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:border-cyan-300/30">
                  <p className="font-medium text-white">Track Student Applications</p>
                  <p className="mt-1 text-sm text-slate-300">Open the student-facing tracker.</p>
                </Link>
                <Link to="/events" className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:border-cyan-300/30">
                  <p className="font-medium text-white">Manage Event Visibility</p>
                  <p className="mt-1 text-sm text-slate-300">Review public event content.</p>
                </Link>
                {isAdmin && (
                  <Link to="/admin/board-management" className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:border-cyan-300/30">
                    <p className="font-medium text-white">Board Member Control</p>
                    <p className="mt-1 text-sm text-slate-300">Update profiles and leadership content.</p>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-br from-cyan-400/15 to-blue-400/10 text-white">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Next Step</p>
                <h2 className="mt-3 text-2xl font-bold">Launch your secure workspace</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  This area is now your signed-in gateway. We can extend it into a student portal, staff dashboard, analytics center, or AI assistant hub next.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-cyan-100">
                  Continue building
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

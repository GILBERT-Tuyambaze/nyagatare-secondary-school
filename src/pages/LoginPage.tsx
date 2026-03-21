import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Seo from '@/components/Seo'
import { Cpu, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'

const loginModes = [
  {
    id: 'applicant',
    label: 'Applicant',
    title: 'Applicant Login',
    description: 'Use the email you submitted during application and the applicant account you created after applying.',
    emailPlaceholder: 'applicant@email.com',
  },
  {
    id: 'student',
    label: 'Student',
    title: 'Student Login',
    description: 'Student portal access for marks, tasks, and school services.',
    emailPlaceholder: 'student@nyagataress.edu.rw',
  },
  {
    id: 'parent',
    label: 'Parent',
    title: 'Parent Login',
    description: 'Parent and parent leader access for learner updates and school communication.',
    emailPlaceholder: 'parent@email.com',
  },
  {
    id: 'staff',
    label: 'Staff',
    title: 'Staff Login',
    description: 'Staff, DOS, Headmaster, admissions office, and administrators sign in here.',
    emailPlaceholder: 'staff@nyagataress.edu.rw',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginMode, setLoginMode] = useState('staff')
  const { user, signIn, signOut, loading } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error.message ?? 'An unexpected error occurred.')
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading secure workspace...</div>
  }

  if (user) {
    return <Navigate to="/system" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(160deg,_#020617_0%,_#111827_48%,_#0f172a_100%)] px-4 py-12 text-white">
      <Seo
        title="NSS Digital System Login | Nyagatare Secondary School"
        description="Secure login for applicants, students, parents, and staff of Nyagatare Secondary School."
        path="/login"
        robots="noindex,nofollow"
      />
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Open NSS Digital System
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Open NSS Digital System
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Sign in through the right access path for applicants, students, parents, or staff.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Cpu className="h-6 w-6 text-cyan-300" />
              <p className="mt-3 font-semibold">Smart Control</p>
              <p className="mt-1 text-sm text-slate-300">Fast access to digital modules and advanced workflows.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <p className="mt-3 font-semibold">Protected Access</p>
              <p className="mt-1 text-sm text-slate-300">Authenticated entry for school staff and authorized users.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <LockKeyhole className="h-6 w-6 text-fuchsia-300" />
              <p className="mt-3 font-semibold">Secure Sessions</p>
              <p className="mt-1 text-sm text-slate-300">A cleaner gateway into your private school system.</p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-white/8 text-white shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Login</CardTitle>
            <CardDescription className="text-slate-300">
              Separate entry points for each school user group, all connected to the same secure system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMode} onValueChange={setLoginMode} className="space-y-5">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/70 md:grid-cols-4">
                {loginModes.map((mode) => (
                  <TabsTrigger key={mode.id} value={mode.id}>
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {loginModes.map((mode) => (
                <TabsContent key={mode.id} value={mode.id}>
                  <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white">{mode.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{mode.description}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-${mode.id}`}>Email</Label>
                      <Input
                        id={`email-${mode.id}`}
                        type="email"
                        placeholder={mode.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`password-${mode.id}`}>Password</Label>
                      <Input
                        id={`password-${mode.id}`}
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      Open {mode.label} Access
                    </Button>

                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <Link to="/" className="hover:text-cyan-200">
                        Return to website
                      </Link>
                      <button type="button" onClick={handleLogout} className="hover:text-cyan-200">
                        Clear session
                      </button>
                    </div>
                  </form>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

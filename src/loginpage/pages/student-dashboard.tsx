import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '../components/Card'
import { studentMetrics, studentTasks } from '../lib/db'

export default function StudentDashboardPage() {
  const { accessProfile } = useAuth()

  return (
    <div className="space-y-6">
      <Card title="Student Dashboard" description="A focused learner workspace for progress, tasks, and personal momentum.">
        <div className="grid gap-4 md:grid-cols-3">
          {studentMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-cyan-200">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-300">{metric.trend}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Learner Action Queue" description={`Personalized for ${accessProfile.displayName}.`}>
        <div className="space-y-4">
          {studentTasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-400">Due: {task.due}</p>
                </div>
                <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{task.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

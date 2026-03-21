import { AreaChart, BarChart3, ShieldAlert, Upload } from 'lucide-react'
import { Card } from './Card'

const futureModules = [
  {
    title: 'Marks and Performance Trends',
    detail: 'Ready for line charts like student performance by term or subject once a real marks dataset is connected.',
    icon: AreaChart,
    needs: 'Needs `marks` data source',
  },
  {
    title: 'Fee Collection Analytics',
    detail: 'Ready for monthly fee and revenue graphs when a dedicated payments table is added beyond the current donation records.',
    icon: BarChart3,
    needs: 'Needs `payments` data source',
  },
  {
    title: 'Discipline Case Trends',
    detail: 'Ready for open, resolved, and pending discipline charts once case records are stored in Firestore.',
    icon: ShieldAlert,
    needs: 'Needs `discipline_cases` data source',
  },
  {
    title: 'Teacher Upload Activity',
    detail: 'Ready to measure mark uploads and active teaching workflows once assessment logging is available.',
    icon: Upload,
    needs: 'Needs `marks` or `activity_logs` data source',
  },
]

export function SuperAdminFutureModules() {
  return (
    <Card title="Future Analytics Modules" description="Structured placeholders for the checklist items that still need real datasets before they can become live dashboard widgets.">
      <div className="grid gap-4 md:grid-cols-2">
        {futureModules.map((module) => {
          const Icon = module.icon
          return (
            <div key={module.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{module.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{module.detail}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-amber-300">{module.needs}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

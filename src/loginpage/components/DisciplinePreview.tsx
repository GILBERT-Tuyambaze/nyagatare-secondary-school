import { Badge } from '@/components/ui/badge'
import { DisciplineCase } from '@/types/database'

const disciplineTone: Record<DisciplineCase['status'], string> = {
  warning: 'bg-amber-500/15 text-amber-200',
  monitoring: 'bg-sky-500/15 text-sky-200',
  resolved: 'bg-emerald-500/15 text-emerald-200',
}

export function DisciplinePreview({
  cases,
  emptyMessage,
}: {
  cases: DisciplineCase[]
  emptyMessage?: string
}) {
  if (cases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
        {emptyMessage || 'No discipline records are currently attached to this learner view.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cases.map((caseItem) => (
        <div key={caseItem.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{caseItem.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{caseItem.student_name}</p>
            </div>
            <Badge className={disciplineTone[caseItem.status]}>{caseItem.status}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-200">{caseItem.summary}</p>
          {caseItem.staff_comment ? <p className="mt-3 text-sm text-cyan-200">Staff note: {caseItem.staff_comment}</p> : null}
        </div>
      ))}
    </div>
  )
}

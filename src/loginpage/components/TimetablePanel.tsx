import { Badge } from '@/components/ui/badge'
import { TimetableEntry } from '@/types/database'

type TimetablePanelProps = {
  entries: TimetableEntry[]
  title: string
  description: string
  emptyMessage: string
  groupBy?: 'day' | 'teacher'
}

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function TimetablePanel({
  entries,
  title,
  description,
  emptyMessage,
  groupBy = 'day',
}: TimetablePanelProps) {
  const groups = [...entries]
    .sort((left, right) => {
      if (groupBy === 'day') {
        const dayDifference = dayOrder.indexOf(left.day) - dayOrder.indexOf(right.day)
        if (dayDifference !== 0) return dayDifference
      } else {
        const teacherDifference = left.teacher_name.localeCompare(right.teacher_name)
        if (teacherDifference !== 0) return teacherDifference
      }
      return left.period_number - right.period_number
    })
    .reduce<Record<string, TimetableEntry[]>>((accumulator, entry) => {
      const key = groupBy === 'day' ? entry.day : entry.teacher_name
      accumulator[key] = [...(accumulator[key] || []), entry]
      return accumulator
    }, {})

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      {!entries.length ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : null}

      {Object.entries(groups).map(([group, groupEntries]) => (
        <div key={group} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-white">{group}</h4>
            <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">{groupEntries.length} periods</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {groupEntries.map((entry) => (
              <div key={entry.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[0.4fr,1fr,1fr,1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Period</p>
                  <p className="mt-1 font-semibold text-white">{entry.period_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subject</p>
                  <p className="mt-1 text-slate-200">{entry.subject_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Teacher</p>
                  <p className="mt-1 text-slate-200">{entry.teacher_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Class</p>
                  <p className="mt-1 text-slate-200">{entry.class_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

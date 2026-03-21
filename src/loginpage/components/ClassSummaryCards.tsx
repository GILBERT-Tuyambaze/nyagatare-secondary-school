import { Users, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react'
import { Classroom } from '../types'
import { ClassTeacherAssignment, DisciplineCase, LearningResource, StudentMark } from '@/types/database'

const iconMap = {
  classes: GraduationCap,
  teachers: Users,
  resources: BookOpen,
  discipline: ShieldAlert,
} as const

export function ClassSummaryCards({
  classes,
  assignments,
  resources,
  marks,
  disciplineCases,
}: {
  classes: Classroom[]
  assignments: ClassTeacherAssignment[]
  resources: LearningResource[]
  marks: StudentMark[]
  disciplineCases: DisciplineCase[]
}) {
  const items = [
    {
      key: 'classes',
      label: 'Active Classes',
      value: classes.length,
      note: `${new Set(classes.map((item) => item.department)).size} departments covered`,
    },
    {
      key: 'teachers',
      label: 'Teacher Assignments',
      value: assignments.length,
      note: `${new Set(assignments.map((item) => item.teacher_user_id)).size} teachers mapped to classes`,
    },
    {
      key: 'resources',
      label: 'Learning Resources',
      value: resources.length,
      note: `${marks.length} marks currently on record`,
    },
    {
      key: 'discipline',
      label: 'Open Discipline Cases',
      value: disciplineCases.filter((item) => item.status !== 'resolved').length,
      note: `${disciplineCases.length} total student wellbeing records`,
    },
  ] as const

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = iconMap[item.key]
        return (
          <div key={item.key} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300">{item.note}</p>
          </div>
        )
      })}
    </div>
  )
}

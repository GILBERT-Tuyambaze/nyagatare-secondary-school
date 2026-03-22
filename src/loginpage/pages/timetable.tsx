import { useEffect, useMemo, useState } from 'react'
import { Download, Route, Sparkles, TimerReset, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '../components/Card'
import {
  createTimetableSubjectRequirement,
  getAccessProfiles,
  getClasses,
  getClassTeacherAssignments,
  getSchoolDayStructures,
  getSubjects,
  getTeacherTimetableSettings,
  getTimetableDrafts,
  getTimetableEntries,
  getTimetableSubjectRequirements,
  logActivity,
  replaceTimetableEntries,
  upsertTimetableDraft,
  updateTimetableSubjectRequirement,
  upsertSchoolDayStructure,
  upsertTeacherTimetableSetting,
} from '@/services/firestoreService'
import {
  SchoolDayStructure,
  SchoolSubject,
  TeacherTimetableSetting,
  TimetableDraft,
  TimetableEntry,
  TimetableSubjectRequirement,
} from '@/types/database'
import { Classroom, SystemUser } from '../types'

type TimetableState = {
  classes: Classroom[]
  profiles: SystemUser[]
  subjects: SchoolSubject[]
  assignments: Awaited<ReturnType<typeof getClassTeacherAssignments>>
  structures: SchoolDayStructure[]
  requirements: TimetableSubjectRequirement[]
  teacherSettings: TeacherTimetableSetting[]
  entries: TimetableEntry[]
  drafts: TimetableDraft[]
}

type RequirementDraft = {
  class_id: string
  subject_id: string
  priority: TimetableSubjectRequirement['priority']
  period_pattern: TimetableSubjectRequirement['period_pattern']
  weekly_periods: string
  preferred_session: TimetableSubjectRequirement['preferred_session']
  teacher_user_id: string
  academic_year: string
  term: string
}

type TimetableAiGenerationPlan = {
  recommended_order?: string[]
  notes?: string[]
  focus?: string[]
}

type AiConflictSuggestion = {
  id: string
  title: string
  reason: string
  target_type: 'requirement' | 'teacher_setting'
  target_id: string
  change: 'preferred_session' | 'assigned_teacher' | 'max_periods_per_day'
  value: string | number
  teacher_user_id?: string
  teacher_name?: string
}

const emptyState: TimetableState = {
  classes: [],
  profiles: [],
  subjects: [],
  assignments: [],
  structures: [],
  requirements: [],
  teacherSettings: [],
  entries: [],
  drafts: [],
}

const defaultStructureDraft = {
  label: 'Main School Day',
  start_time: '08:00',
  end_time: '15:30',
  period_length_minutes: 40,
  periods_per_day: 8,
  morning_break_start: '10:20',
  morning_break_end: '10:35',
  lunch_start: '12:40',
  lunch_end: '13:20',
  working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
}

const emptyRequirementDraft: RequirementDraft = {
  class_id: '',
  subject_id: '',
  priority: 'core',
  period_pattern: 'single',
  weekly_periods: '5',
  preferred_session: 'morning',
  teacher_user_id: '',
  academic_year: '2026',
  term: 'Term 1',
}

const workflowSteps = [
  'Collect classes, subjects, teacher limits, and school day structure.',
  'Set class subject requirements with Core/Light priority and Single/Double/Triple periods.',
  'Save teacher limits so the generator respects max classes and max periods per day.',
  'Generate the draft timetable with automatic conflict prevention for teacher-period collisions.',
  'Review conflicts or uncovered slots, then adjust data or re-run generation.',
  'Export the final timetable by class, teacher, or full school view.',
]

const blockSizeByPattern: Record<TimetableSubjectRequirement['period_pattern'], number> = {
  single: 1,
  double: 2,
  triple: 3,
}

const classOperationsRoles = ['SuperAdmin', 'Headmaster', 'DOS', 'HOD'] as const
const fieldClassName = 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500'

const createSequenceGroup = (classId: string, day: string, startPeriod: number, subjectId: string) =>
  `${classId}-${day}-${startPeriod}-${subjectId}`

function RuleChip({ text }: { text: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">{text}</div>
}

function DiagramBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2 text-cyan-200">
        {icon}
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-slate-300">{children}</p>
    </div>
  )
}

function TeacherSettingRow({
  teacher,
  existing,
  assignmentCount,
  saving,
  onSave,
}: {
  teacher: SystemUser
  existing?: TeacherTimetableSetting
  assignmentCount: number
  saving: boolean
  onSave: (teacher: SystemUser, values: { max_classes: number; max_periods_per_day: number; min_periods_per_week: number }) => Promise<void>
}) {
  const [maxClasses, setMaxClasses] = useState(existing?.max_classes || Math.max(1, assignmentCount))
  const [maxPeriodsPerDay, setMaxPeriodsPerDay] = useState(existing?.max_periods_per_day || 4)
  const [minPeriodsPerWeek, setMinPeriodsPerWeek] = useState(existing?.min_periods_per_week || 0)

  useEffect(() => {
    setMaxClasses(existing?.max_classes || Math.max(1, assignmentCount))
    setMaxPeriodsPerDay(existing?.max_periods_per_day || 4)
    setMinPeriodsPerWeek(existing?.min_periods_per_week || 0)
  }, [assignmentCount, existing?.max_classes, existing?.max_periods_per_day, existing?.min_periods_per_week])

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{teacher.fullName}</p>
          <p className="text-sm text-slate-400">{teacher.role} · {assignmentCount} current class-subject assignments</p>
        </div>
        <Button
          type="button"
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          disabled={saving}
          onClick={() => void onSave(teacher, { max_classes: maxClasses, max_periods_per_day: maxPeriodsPerDay, min_periods_per_week: minPeriodsPerWeek })}
        >
          {saving ? 'Saving...' : 'Save Limits'}
        </Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor={`max-classes-${teacher.id}`}>Max Classes</Label>
          <Input id={`max-classes-${teacher.id}`} type="number" min="1" value={maxClasses} onChange={(event) => setMaxClasses(Number(event.target.value) || 1)} className={fieldClassName} />
        </div>
        <div>
          <Label htmlFor={`max-periods-${teacher.id}`}>Max Periods / Day</Label>
          <Input id={`max-periods-${teacher.id}`} type="number" min="1" value={maxPeriodsPerDay} onChange={(event) => setMaxPeriodsPerDay(Number(event.target.value) || 1)} className={fieldClassName} />
        </div>
        <div>
          <Label htmlFor={`min-periods-${teacher.id}`}>Minimum Periods / Week</Label>
          <Input id={`min-periods-${teacher.id}`} type="number" min="0" value={minPeriodsPerWeek} onChange={(event) => setMinPeriodsPerWeek(Number(event.target.value) || 0)} className={fieldClassName} />
        </div>
      </div>
    </div>
  )
}

export default function TimetablePage() {
  const { accessProfile, user } = useAuth()
  const [data, setData] = useState<TimetableState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [savingStructure, setSavingStructure] = useState(false)
  const [savingRequirement, setSavingRequirement] = useState(false)
  const [savingTeacherSettings, setSavingTeacherSettings] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [structureDraft, setStructureDraft] = useState(defaultStructureDraft)
  const [requirementDraft, setRequirementDraft] = useState<RequirementDraft>(emptyRequirementDraft)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('all')
  const [selectedDay, setSelectedDay] = useState('all')
  const [generationConflicts, setGenerationConflicts] = useState<string[]>([])
  const [draftEntries, setDraftEntries] = useState<Array<Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>>>([])
  const [draftMode, setDraftMode] = useState<'rules' | 'ai' | null>(null)
  const [savingApprovedTimetable, setSavingApprovedTimetable] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiWorking, setAiWorking] = useState(false)
  const [lastAiGenerationNotes, setLastAiGenerationNotes] = useState<string[]>([])
  const [aiConflictSuggestions, setAiConflictSuggestions] = useState<AiConflictSuggestion[]>([])
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)
  const [applyingAllSuggestions, setApplyingAllSuggestions] = useState(false)

  const canManage = classOperationsRoles.includes(accessProfile.role as (typeof classOperationsRoles)[number])
  const actorUid = user?.uid || accessProfile.email || 'system-user'
  const actorName = accessProfile.displayName

  const load = async () => {
    setLoading(true)
    try {
      const [classes, profiles, subjects, assignments, structures, requirements, teacherSettings, entries, drafts] = await Promise.all([
        getClasses(),
        getAccessProfiles(),
        getSubjects(),
        getClassTeacherAssignments(),
        getSchoolDayStructures(),
        getTimetableSubjectRequirements(),
        getTeacherTimetableSettings(),
        getTimetableEntries(),
        getTimetableDrafts(),
      ])
      setData({ classes, profiles, subjects, assignments, structures, requirements, teacherSettings, entries, drafts })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!selectedClassId && data.classes[0]?.id) {
      setSelectedClassId(data.classes[0].id)
      setRequirementDraft((current) => ({ ...current, class_id: data.classes[0].id }))
    }
  }, [data.classes, selectedClassId])

  const teacherProfiles = useMemo(
    () => data.profiles.filter((item) => ['Teacher', 'HOD', 'Headmaster', 'DOS'].includes(item.role)),
    [data.profiles]
  )

  const activeStructure = data.structures[0]
  const workingDays = activeStructure?.working_days?.length ? activeStructure.working_days : defaultStructureDraft.working_days
  const classLookup = useMemo(() => new Map(data.classes.map((item) => [item.id, item])), [data.classes])
  const subjectLookup = useMemo(() => new Map(data.subjects.map((item) => [item.id, item])), [data.subjects])
  const teacherLookup = useMemo(() => new Map(teacherProfiles.map((item) => [item.id, item])), [teacherProfiles])
  const teacherSettingLookup = useMemo(
    () => new Map(data.teacherSettings.map((item) => [item.teacher_user_id, item])),
    [data.teacherSettings]
  )

  useEffect(() => {
    if (activeStructure) {
      setStructureDraft({
        label: activeStructure.label,
        start_time: activeStructure.start_time,
        end_time: activeStructure.end_time,
        period_length_minutes: activeStructure.period_length_minutes,
        periods_per_day: activeStructure.periods_per_day,
        morning_break_start: activeStructure.morning_break_start || '',
        morning_break_end: activeStructure.morning_break_end || '',
        lunch_start: activeStructure.lunch_start || '',
        lunch_end: activeStructure.lunch_end || '',
        working_days: activeStructure.working_days,
      })
    }
  }, [activeStructure])

  const selectedClass = data.classes.find((item) => item.id === selectedClassId) || data.classes[0]
  const selectedClassRequirements = data.requirements.filter((item) => item.class_id === selectedClass?.id)
  const filteredEntries = useMemo(() => {
    return data.entries.filter((entry) => {
      const classOk = !selectedClassId || entry.class_id === selectedClassId
      const teacherOk = selectedTeacherId === 'all' || entry.teacher_user_id === selectedTeacherId
      const dayOk = selectedDay === 'all' || entry.day === selectedDay
      return classOk && teacherOk && dayOk
    })
  }, [data.entries, selectedClassId, selectedTeacherId, selectedDay])

  const timetableCoverage = useMemo(() => {
    const totalRequired = data.requirements.reduce((sum, item) => sum + item.weekly_periods, 0)
    return {
      totalRequired,
      totalAssigned: data.entries.length,
      completion: totalRequired ? Math.min(100, Math.round((data.entries.length / totalRequired) * 100)) : 0,
    }
  }, [data.entries.length, data.requirements])

  const generationRequirements = useMemo(
    () =>
      data.requirements.filter(
        (item) => item.academic_year === requirementDraft.academic_year && item.term === requirementDraft.term
      ),
    [data.requirements, requirementDraft.academic_year, requirementDraft.term]
  )
  const activeDraft = useMemo(
    () =>
      data.drafts.find(
        (item) => item.academic_year === requirementDraft.academic_year && item.term === requirementDraft.term
      ) || null,
    [data.drafts, requirementDraft.academic_year, requirementDraft.term]
  )

  useEffect(() => {
    if (!activeDraft) return
    setDraftEntries(activeDraft.entries || [])
    setDraftMode(activeDraft.generation_mode)
    setGenerationConflicts(activeDraft.conflict_notes || [])
    setLastAiGenerationNotes(activeDraft.ai_notes || [])
  }, [activeDraft])

  const timetableAiContext = useMemo(
    () => ({
      role: accessProfile.role,
      academic_year: requirementDraft.academic_year,
      term: requirementDraft.term,
      school_day_structure: activeStructure
        ? {
            label: activeStructure.label,
            periods_per_day: activeStructure.periods_per_day,
            start_time: activeStructure.start_time,
            end_time: activeStructure.end_time,
            working_days: activeStructure.working_days,
          }
        : null,
      totals: {
        classes: data.classes.length,
        requirements: data.requirements.length,
        teacher_settings: data.teacherSettings.length,
        generated_entries: data.entries.length,
        latest_conflicts: generationConflicts.length,
      },
      selected_class: selectedClass
        ? {
            id: selectedClass.id,
            name: selectedClass.name,
            department: selectedClass.department,
          }
        : null,
      timetable_requirements: data.requirements
        .filter((item) => item.academic_year === requirementDraft.academic_year && item.term === requirementDraft.term)
        .slice(0, 40)
        .map((item) => ({
          class_name: item.class_name,
          subject_name: item.subject_name,
          priority: item.priority,
          period_pattern: item.period_pattern,
          weekly_periods: item.weekly_periods,
          preferred_session: item.preferred_session,
          teacher_name: item.assigned_teacher_name || 'Not mapped',
        })),
      teacher_limits: data.teacherSettings.slice(0, 30).map((item) => ({
        teacher_name: item.teacher_name,
        max_classes: item.max_classes,
        max_periods_per_day: item.max_periods_per_day,
        min_periods_per_week: item.min_periods_per_week,
      })),
      latest_conflicts: generationConflicts,
    }),
    [accessProfile.role, activeStructure, data.classes.length, data.entries.length, data.requirements, data.teacherSettings, generationConflicts, requirementDraft.academic_year, requirementDraft.term, selectedClass]
  )

  const handleSaveStructure = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) return
    setSavingStructure(true)
    try {
      await upsertSchoolDayStructure(activeStructure?.id || null, structureDraft)
      await logActivity({
        action: 'timetable_day_structure',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'school_day_structures',
        target_id: activeStructure?.id || 'new',
        summary: `Updated the school day timetable structure to ${structureDraft.periods_per_day} periods per day.`,
      })
      await load()
    } finally {
      setSavingStructure(false)
    }
  }

  const handleSaveRequirement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage || !requirementDraft.class_id || !requirementDraft.subject_id) return

    const classRecord = classLookup.get(requirementDraft.class_id)
    const subject = subjectLookup.get(requirementDraft.subject_id)
    const teacher = teacherLookup.get(requirementDraft.teacher_user_id)
    if (!classRecord || !subject) return

    setSavingRequirement(true)
    try {
      await createTimetableSubjectRequirement({
        class_id: classRecord.id,
        class_name: classRecord.name,
        subject_id: subject.id,
        subject_name: subject.name,
        priority: requirementDraft.priority,
        period_pattern: requirementDraft.period_pattern,
        weekly_periods: Number(requirementDraft.weekly_periods),
        preferred_session: requirementDraft.preferred_session,
        assigned_teacher_user_id: teacher?.id,
        assigned_teacher_name: teacher?.fullName,
        academic_year: requirementDraft.academic_year,
        term: requirementDraft.term,
      })
      await logActivity({
        action: 'timetable_requirement_create',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'timetable_subject_requirements',
        target_id: `${classRecord.id}-${subject.id}`,
        summary: `Added timetable requirement for ${subject.name} in ${classRecord.name}.`,
      })
      setRequirementDraft((current) => ({
        ...emptyRequirementDraft,
        class_id: current.class_id,
        academic_year: current.academic_year,
        term: current.term,
      }))
      await load()
    } finally {
      setSavingRequirement(false)
    }
  }

  const handleSaveTeacherSetting = async (teacher: SystemUser, values: { max_classes: number; max_periods_per_day: number; min_periods_per_week: number }) => {
    if (!canManage) return
    setSavingTeacherSettings(true)
    try {
      const existing = data.teacherSettings.find((item) => item.teacher_user_id === teacher.id)
      await upsertTeacherTimetableSetting(existing?.id || null, {
        teacher_user_id: teacher.id,
        teacher_name: teacher.fullName,
        subjects_can_teach: data.assignments.filter((item) => item.teacher_user_id === teacher.id).map((item) => item.subject_name),
        max_classes: values.max_classes,
        max_periods_per_day: values.max_periods_per_day,
        min_periods_per_week: values.min_periods_per_week,
        available_days: workingDays,
      })
      await load()
    } finally {
      setSavingTeacherSettings(false)
    }
  }

  const handleGenerateTimetable = async (mode: 'rules' | 'ai') => {
    if (!canManage || !activeStructure) return

    setGenerating(true)
    setGenerationConflicts([])
    setDraftEntries([])
    setDraftMode(null)
    try {
      const aiPlan = mode === 'ai' ? await requestAiGenerationPlan() : null
      const aiOrder = new Map((aiPlan?.recommended_order || []).map((key, index) => [key, index]))
      const requirements = generationRequirements
        .sort((left, right) => {
          const leftKey = `${left.class_id}|${left.subject_id}|${left.academic_year}|${left.term}`
          const rightKey = `${right.class_id}|${right.subject_id}|${right.academic_year}|${right.term}`
          const leftAiRank = aiOrder.get(leftKey)
          const rightAiRank = aiOrder.get(rightKey)

          if (typeof leftAiRank === 'number' || typeof rightAiRank === 'number') {
            if (typeof leftAiRank === 'number' && typeof rightAiRank === 'number' && leftAiRank !== rightAiRank) {
              return leftAiRank - rightAiRank
            }
            if (typeof leftAiRank === 'number') return -1
            if (typeof rightAiRank === 'number') return 1
          }

          const priorityScore = left.priority === right.priority ? 0 : left.priority === 'core' ? -1 : 1
          if (priorityScore !== 0) return priorityScore
          return blockSizeByPattern[right.period_pattern] - blockSizeByPattern[left.period_pattern]
        })

      const periodsPerDay = activeStructure.periods_per_day
      const morningLimit = Math.max(1, Math.ceil(periodsPerDay / 2))
      const classBusy = new Set<string>()
      const teacherBusy = new Set<string>()
      const teacherDayLoad = new Map<string, number>()
      const teacherWeekLoad = new Map<string, number>()
      const entries: Array<Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>> = []
      const conflicts: string[] = []

      const isSlotFree = (classId: string, teacherId: string, day: string, periodNumber: number) =>
        !classBusy.has(`${classId}-${day}-${periodNumber}`) && !teacherBusy.has(`${teacherId}-${day}-${periodNumber}`)

      requirements.forEach((requirement) => {
        const mappedAssignment = data.assignments.find(
          (item) =>
            item.class_id === requirement.class_id &&
            item.subject_id === requirement.subject_id &&
            item.academic_year === requirement.academic_year &&
            item.term === requirement.term
        )
        const teacherId = requirement.assigned_teacher_user_id || mappedAssignment?.teacher_user_id
        const teacherName = requirement.assigned_teacher_name || mappedAssignment?.teacher_name || teacherLookup.get(teacherId || '')?.fullName

        if (!teacherId || !teacherName) {
          conflicts.push(`No teacher is mapped to ${requirement.subject_name} in ${requirement.class_name}.`)
          return
        }

        const teacherSetting = teacherSettingLookup.get(teacherId)
        const maxPerDay = teacherSetting?.max_periods_per_day || 4
        const blockSize = blockSizeByPattern[requirement.period_pattern]
        let remaining = requirement.weekly_periods

        while (remaining > 0) {
          const currentBlock = Math.min(blockSize, remaining)
          let placed = false

          for (const day of workingDays) {
            const candidatePeriods =
              requirement.preferred_session === 'morning'
                ? Array.from({ length: morningLimit }, (_, index) => index + 1)
                : requirement.preferred_session === 'afternoon'
                  ? Array.from({ length: periodsPerDay - morningLimit }, (_, index) => index + morningLimit + 1)
                  : Array.from({ length: periodsPerDay }, (_, index) => index + 1)

            for (const startPeriod of candidatePeriods) {
              const blockPeriods = Array.from({ length: currentBlock }, (_, index) => startPeriod + index)
              if (blockPeriods[blockPeriods.length - 1] > periodsPerDay) continue
              if (requirement.preferred_session === 'morning' && blockPeriods.some((period) => period > morningLimit)) continue
              if (requirement.preferred_session === 'afternoon' && blockPeriods.some((period) => period <= morningLimit)) continue

              const currentLoad = teacherDayLoad.get(`${teacherId}-${day}`) || 0
              if (currentLoad + currentBlock > maxPerDay) continue
              if (!blockPeriods.every((period) => isSlotFree(requirement.class_id, teacherId, day, period))) continue

              const sequenceGroup = createSequenceGroup(requirement.class_id, day, startPeriod, requirement.subject_id)
              blockPeriods.forEach((periodNumber) => {
                classBusy.add(`${requirement.class_id}-${day}-${periodNumber}`)
                teacherBusy.add(`${teacherId}-${day}-${periodNumber}`)
                teacherDayLoad.set(`${teacherId}-${day}`, (teacherDayLoad.get(`${teacherId}-${day}`) || 0) + 1)
                teacherWeekLoad.set(teacherId, (teacherWeekLoad.get(teacherId) || 0) + 1)
                entries.push({
                  class_id: requirement.class_id,
                  class_name: requirement.class_name,
                  day,
                  period_number: periodNumber,
                  subject_id: requirement.subject_id,
                  subject_name: requirement.subject_name,
                  teacher_user_id: teacherId,
                  teacher_name: teacherName,
                  academic_year: requirement.academic_year,
                  term: requirement.term,
                  sequence_group: sequenceGroup,
                  generated_by: actorName,
                  generated_at: new Date().toISOString(),
                })
              })

              remaining -= currentBlock
              placed = true
              break
            }
            if (placed) break
          }

          if (!placed) {
            conflicts.push(`Could not place ${requirement.subject_name} for ${requirement.class_name} without a teacher conflict.`)
            break
          }
        }
      })

      data.teacherSettings.forEach((setting) => {
        if (setting.min_periods_per_week && (teacherWeekLoad.get(setting.teacher_user_id) || 0) < setting.min_periods_per_week) {
          conflicts.push(`${setting.teacher_name} is below the weekly target (${teacherWeekLoad.get(setting.teacher_user_id) || 0}/${setting.min_periods_per_week} periods).`)
        }
      })

      await upsertTimetableDraft({
        academic_year: requirementDraft.academic_year,
        term: requirementDraft.term,
        status: 'pending_approval',
        generation_mode: mode,
        generated_by: actorName,
        generated_at: new Date().toISOString(),
        conflict_notes: conflicts,
        ai_notes: lastAiGenerationNotes,
        entries,
      })
      await logActivity({
        action: mode === 'ai' ? 'timetable_draft_generate_ai' : 'timetable_draft_generate',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'timetable_drafts',
        target_id: `${requirementDraft.academic_year}-${requirementDraft.term}`,
        summary: `${mode === 'ai' ? 'AI-assisted' : 'Rule-based'} timetable draft generated with ${entries.length} periods for ${requirementDraft.academic_year} ${requirementDraft.term} and is waiting for approval.`,
      })

      setDraftEntries(entries)
      setDraftMode(mode)
      setGenerationConflicts(conflicts)
      await load()
    } finally {
      setGenerating(false)
    }
  }

  const approveAndSaveTimetable = async () => {
    if (!canManage || !draftEntries.length) return

    setSavingApprovedTimetable(true)
    try {
      await replaceTimetableEntries(
        { academic_year: requirementDraft.academic_year, term: requirementDraft.term },
        draftEntries
      )
      await logActivity({
        action: draftMode === 'ai' ? 'timetable_approve_ai' : 'timetable_approve',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'timetable_entries',
        target_id: `${requirementDraft.academic_year}-${requirementDraft.term}`,
        summary: `${draftMode === 'ai' ? 'AI-assisted' : 'Rule-based'} timetable approved and saved with ${draftEntries.length} periods for ${requirementDraft.academic_year} ${requirementDraft.term}.`,
      })
      await upsertTimetableDraft({
        academic_year: requirementDraft.academic_year,
        term: requirementDraft.term,
        status: 'approved',
        generation_mode: draftMode || 'rules',
        generated_by: activeDraft?.generated_by || actorName,
        generated_at: activeDraft?.generated_at || new Date().toISOString(),
        approved_by: actorName,
        approved_at: new Date().toISOString(),
        conflict_notes: generationConflicts,
        ai_notes: lastAiGenerationNotes,
        entries: draftEntries,
      })
      setAiAdvice('The generated timetable was approved and saved to the database successfully.')
      setDraftEntries([])
      setDraftMode(null)
      await load()
    } finally {
      setSavingApprovedTimetable(false)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Class', 'Day', 'Period', 'Subject', 'Teacher', 'Academic Year', 'Term'],
      ...filteredEntries.map((entry) => [entry.class_name, entry.day, entry.period_number.toString(), entry.subject_name, entry.teacher_name, entry.academic_year, entry.term]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nss-timetable-${selectedClass?.name || 'school'}-${requirementDraft.term}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const parseAiJsonPlan = (text: string): TimetableAiGenerationPlan | null => {
    const trimmed = text.trim()
    const withoutFences = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    try {
      return JSON.parse(withoutFences) as TimetableAiGenerationPlan
    } catch {
      const jsonStart = withoutFences.indexOf('{')
      const jsonEnd = withoutFences.lastIndexOf('}')
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          return JSON.parse(withoutFences.slice(jsonStart, jsonEnd + 1)) as TimetableAiGenerationPlan
        } catch {
          return null
        }
      }
      return null
    }
  }

  const parseAiConflictSuggestions = (text: string): AiConflictSuggestion[] => {
    const trimmed = text.trim()
    const withoutFences = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const tryParse = (value: string) => {
      try {
        return JSON.parse(value) as { suggestions?: AiConflictSuggestion[] } | AiConflictSuggestion[]
      } catch {
        return null
      }
    }

    const parsed = tryParse(withoutFences) ?? (() => {
      const jsonStart = withoutFences.indexOf('{')
      const jsonEnd = withoutFences.lastIndexOf('}')
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        return tryParse(withoutFences.slice(jsonStart, jsonEnd + 1))
      }
      const listStart = withoutFences.indexOf('[')
      const listEnd = withoutFences.lastIndexOf(']')
      if (listStart >= 0 && listEnd > listStart) {
        return tryParse(withoutFences.slice(listStart, listEnd + 1))
      }
      return null
    })()

    if (!parsed) return []
    if (Array.isArray(parsed)) return parsed
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : []
  }

  const requestAiSupport = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed) return

    setAiWorking(true)
    setAiError('')
    try {
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Timetable support request: ${trimmed}`,
          context: {
            module: 'timetable',
            timetable: timetableAiContext,
          },
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'The AI timetable assistant could not respond.')
      }

      setAiAdvice(payload.output_text || 'The AI assistant did not return timetable advice.')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'The AI timetable assistant could not respond.')
    } finally {
      setAiWorking(false)
    }
  }

  const requestAiGenerationPlan = async (): Promise<TimetableAiGenerationPlan | null> => {
    setAiWorking(true)
    setAiError('')
    try {
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: [
            'Create timetable generation guidance for Nyagatare Secondary School.',
            'Return JSON only.',
            'Schema:',
            '{"recommended_order":["classId|subjectId|academicYear|term"],"notes":["short note"],"focus":["short focus point"]}',
            'Order the requirements from highest to lowest placement priority for a rule-based timetable generator.',
            'Prioritize core subjects in the morning, grouped double/triple periods, scarce teachers first, and teacher conflict prevention.',
            'Do not invent data outside the provided timetable context.',
          ].join(' '),
          context: {
            module: 'timetable_generation',
            timetable: {
              ...timetableAiContext,
              timetable_requirements: generationRequirements.slice(0, 80).map((item) => ({
                key: `${item.class_id}|${item.subject_id}|${item.academic_year}|${item.term}`,
                class_name: item.class_name,
                subject_name: item.subject_name,
                priority: item.priority,
                period_pattern: item.period_pattern,
                weekly_periods: item.weekly_periods,
                preferred_session: item.preferred_session,
                teacher_name: item.assigned_teacher_name || 'Not mapped',
                teacher_user_id: item.assigned_teacher_user_id || '',
              })),
            },
          },
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'The AI timetable planner could not respond.')
      }

      const plan = parseAiJsonPlan(payload.output_text || '')

      if (!plan) {
        throw new Error('The AI timetable planner returned an invalid draft format.')
      }

      const notes = [...(plan.notes || []), ...(plan.focus || [])].filter(Boolean)
      setLastAiGenerationNotes(notes)
      setAiAdvice(notes.length ? notes.join('\n') : 'AI-assisted timetable generation plan prepared successfully.')
      return plan
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The AI timetable planner could not respond.'
      setAiError(message)
      setLastAiGenerationNotes([])
      return null
    } finally {
      setAiWorking(false)
    }
  }

  const requestAiConflictSuggestions = async () => {
    if (!generationConflicts.length) {
      setAiError('Generate the timetable first so AI can review real conflicts.')
      return
    }

    setAiWorking(true)
    setAiError('')
    try {
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: [
            'Review these timetable conflicts and return safe, structured fixes only.',
            'Return JSON only.',
            'Schema:',
            '{"suggestions":[{"id":"short-id","title":"short title","reason":"why this helps","target_type":"requirement|teacher_setting","target_id":"requirement-or-setting-id","change":"preferred_session|assigned_teacher|max_periods_per_day","value":"new-value","teacher_user_id":"optional","teacher_name":"optional"}]}',
            'Use only the IDs and teachers provided in context.',
            'Prefer changes that the system can apply directly: requirement preferred session changes, requirement teacher reassignment, or teacher max periods per day changes.',
          ].join(' '),
          context: {
            module: 'timetable_conflict_resolution',
            timetable: {
              ...timetableAiContext,
              conflicts: generationConflicts,
              timetable_requirements: generationRequirements.slice(0, 80).map((item) => ({
                id: item.id,
                key: `${item.class_id}|${item.subject_id}|${item.academic_year}|${item.term}`,
                class_name: item.class_name,
                subject_name: item.subject_name,
                priority: item.priority,
                period_pattern: item.period_pattern,
                preferred_session: item.preferred_session,
                teacher_user_id: item.assigned_teacher_user_id || '',
                teacher_name: item.assigned_teacher_name || 'Not mapped',
              })),
              teacher_settings: data.teacherSettings.map((item) => ({
                id: item.id,
                teacher_user_id: item.teacher_user_id,
                teacher_name: item.teacher_name,
                max_periods_per_day: item.max_periods_per_day,
                min_periods_per_week: item.min_periods_per_week,
              })),
              available_teachers: teacherProfiles.map((item) => ({
                id: item.id,
                fullName: item.fullName,
                role: item.role,
              })),
            },
          },
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'The AI conflict assistant could not respond.')
      }

      const suggestions = parseAiConflictSuggestions(payload.output_text || '').filter(
        (item) => item.id && item.title && item.reason && item.target_type && item.target_id && item.change
      )

      if (!suggestions.length) {
        throw new Error('The AI conflict assistant did not return any actionable suggestions.')
      }

      setAiConflictSuggestions(suggestions)
      setAiAdvice('AI conflict suggestions are ready. Review each one and apply only the changes you want to keep.')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'The AI conflict assistant could not respond.')
      setAiConflictSuggestions([])
    } finally {
      setAiWorking(false)
    }
  }

  const applyAiSuggestion = async (suggestion: AiConflictSuggestion) => {
    setApplyingSuggestionId(suggestion.id)
    try {
      if (suggestion.target_type === 'requirement') {
        if (suggestion.change === 'preferred_session') {
          await updateTimetableSubjectRequirement(suggestion.target_id, {
            preferred_session: suggestion.value as TimetableSubjectRequirement['preferred_session'],
          })
        } else if (suggestion.change === 'assigned_teacher') {
          const teacherId = suggestion.teacher_user_id || String(suggestion.value)
          const teacher = teacherLookup.get(teacherId)
          if (!teacherId || !teacher) {
            throw new Error('The suggested teacher could not be matched to a known profile.')
          }

          await updateTimetableSubjectRequirement(suggestion.target_id, {
            assigned_teacher_user_id: teacherId,
            assigned_teacher_name: suggestion.teacher_name || teacher.fullName,
          })
        } else {
          throw new Error('This requirement change is not supported yet.')
        }
      } else if (suggestion.target_type === 'teacher_setting') {
        const existing = data.teacherSettings.find((item) => item.id === suggestion.target_id || item.teacher_user_id === suggestion.target_id)
        if (!existing) {
          throw new Error('The suggested teacher setting could not be found.')
        }

        if (suggestion.change !== 'max_periods_per_day') {
          throw new Error('This teacher-setting change is not supported yet.')
        }

        await upsertTeacherTimetableSetting(existing.id, {
          teacher_user_id: existing.teacher_user_id,
          teacher_name: existing.teacher_name,
          subjects_can_teach: existing.subjects_can_teach,
          max_classes: existing.max_classes,
          max_periods_per_day: Number(suggestion.value),
          min_periods_per_week: existing.min_periods_per_week,
          available_days: existing.available_days,
        })
      }

      await logActivity({
        action: 'timetable_ai_suggestion_apply',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: suggestion.target_type === 'requirement' ? 'timetable_subject_requirements' : 'teacher_timetable_settings',
        target_id: suggestion.target_id,
        summary: `Applied AI timetable suggestion: ${suggestion.title}.`,
      })

      setAiConflictSuggestions((current) => current.filter((item) => item.id !== suggestion.id))
      await load()
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'The AI suggestion could not be applied.')
    } finally {
      setApplyingSuggestionId(null)
    }
  }

  const applyAllSafeSuggestions = async (regenerateAfterApply = false) => {
    if (!aiConflictSuggestions.length) return

    setApplyingAllSuggestions(true)
    setAiError('')
    try {
      const suggestionsToApply = [...aiConflictSuggestions]

      for (const suggestion of suggestionsToApply) {
        await applyAiSuggestion(suggestion)
      }

      setAiAdvice(
        regenerateAfterApply
          ? 'All safe AI suggestions were applied. The timetable is being regenerated now.'
          : 'All safe AI suggestions were applied successfully.'
      )

      if (regenerateAfterApply) {
        await handleGenerateTimetable('ai')
      }
    } finally {
      setApplyingAllSuggestions(false)
    }
  }

  const handleAiConflictReview = async () => {
    const prompt =
      generationConflicts.length > 0
        ? `Review these timetable conflicts and suggest the safest next adjustments for DOS: ${generationConflicts.join(' | ')}`
        : 'Review the current timetable setup and suggest what DOS should verify before publishing the timetable.'
    await requestAiSupport(prompt)
  }

  if (loading) {
    return (
      <Card title="Timetable Studio" description="Loading timetable structure, class requirements, and generated schedules.">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">Loading timetable workspace...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Timetable Studio" description="Conflict-aware timetable generation for DOS, leadership, and timetable oversight roles.">
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Coverage</p>
            <p className="mt-3 text-3xl font-bold text-white">{timetableCoverage.completion}%</p>
            <p className="mt-2 text-sm text-slate-400">{timetableCoverage.totalAssigned} of {timetableCoverage.totalRequired} required periods placed.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Classes</p>
            <p className="mt-3 text-3xl font-bold text-white">{data.classes.length}</p>
            <p className="mt-2 text-sm text-slate-400">Classes and streams currently available for scheduling.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Requirements</p>
            <p className="mt-3 text-3xl font-bold text-white">{data.requirements.length}</p>
            <p className="mt-2 text-sm text-slate-400">Subject rules saved with Core/Light and Single/Double/Triple setup.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Conflicts</p>
            <p className="mt-3 text-3xl font-bold text-white">{generationConflicts.length}</p>
            <p className="mt-2 text-sm text-slate-400">Teacher clashes and uncovered periods from the latest generation run.</p>
          </div>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Approval Workflow</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Only approved timetables are saved</h3>
              <p className="mt-2 text-sm text-slate-400">
                Generation now creates a review draft first. DOS, SuperAdmin, Headmaster, and HOD can approve that draft to save it to the database.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-500/15 text-amber-100 hover:bg-amber-500/15">
                {activeDraft ? `Draft status: ${activeDraft.status.replace('_', ' ')}` : 'No saved draft'}
              </Badge>
              <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                Draft periods: {draftEntries.length}
              </Badge>
              <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">
                {draftMode ? `${draftMode === 'ai' ? 'AI-assisted' : 'Rule-based'} draft ready` : 'No draft pending'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Limits</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="view">View & Export</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <div className="grid gap-6 xl:grid-cols-[1.05fr,1.15fr]">
            <Card title="School Day Structure" description="Define the working day once, then use it for every generated timetable.">
              <form className="space-y-4" onSubmit={handleSaveStructure}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="structure-label">Structure Name</Label>
                    <Input id="structure-label" value={structureDraft.label} onChange={(event) => setStructureDraft((current) => ({ ...current, label: event.target.value }))} className={fieldClassName} />
                  </div>
                  <div>
                    <Label htmlFor="periods-per-day">Periods per Day</Label>
                    <Input id="periods-per-day" type="number" min="1" value={structureDraft.periods_per_day} onChange={(event) => setStructureDraft((current) => ({ ...current, periods_per_day: Number(event.target.value) || 1 }))} className={fieldClassName} />
                  </div>
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input id="start-time" type="time" value={structureDraft.start_time} onChange={(event) => setStructureDraft((current) => ({ ...current, start_time: event.target.value }))} className={fieldClassName} />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input id="end-time" type="time" value={structureDraft.end_time} onChange={(event) => setStructureDraft((current) => ({ ...current, end_time: event.target.value }))} className={fieldClassName} />
                  </div>
                  <div>
                    <Label htmlFor="period-length">Period Length (minutes)</Label>
                    <Input id="period-length" type="number" min="20" value={structureDraft.period_length_minutes} onChange={(event) => setStructureDraft((current) => ({ ...current, period_length_minutes: Number(event.target.value) || 40 }))} className={fieldClassName} />
                  </div>
                  <div>
                    <Label htmlFor="working-days">Working Days</Label>
                    <Input id="working-days" value={structureDraft.working_days.join(', ')} onChange={(event) => setStructureDraft((current) => ({ ...current, working_days: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} className={fieldClassName} placeholder="Monday, Tuesday, Wednesday, Thursday, Friday" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={structureDraft.morning_break_start || ''} onChange={(event) => setStructureDraft((current) => ({ ...current, morning_break_start: event.target.value }))} type="time" className={fieldClassName} />
                  <Input value={structureDraft.morning_break_end || ''} onChange={(event) => setStructureDraft((current) => ({ ...current, morning_break_end: event.target.value }))} type="time" className={fieldClassName} />
                  <Input value={structureDraft.lunch_start || ''} onChange={(event) => setStructureDraft((current) => ({ ...current, lunch_start: event.target.value }))} type="time" className={fieldClassName} />
                  <Input value={structureDraft.lunch_end || ''} onChange={(event) => setStructureDraft((current) => ({ ...current, lunch_end: event.target.value }))} type="time" className={fieldClassName} />
                </div>
                <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!canManage || savingStructure}>
                  {savingStructure ? 'Saving structure...' : 'Save School Day Structure'}
                </Button>
              </form>
            </Card>

            <Card title="Subject Requirements by Class" description="Create the scheduling rules the generator will follow for each class and subject.">
              <form className="space-y-4" onSubmit={handleSaveRequirement}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={requirementDraft.class_id} onValueChange={(value) => setRequirementDraft((current) => ({ ...current, class_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{data.classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={requirementDraft.subject_id} onValueChange={(value) => setRequirementDraft((current) => ({ ...current, subject_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{data.subjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={requirementDraft.priority} onValueChange={(value: TimetableSubjectRequirement['priority']) => setRequirementDraft((current) => ({ ...current, priority: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent><SelectItem value="core">Core</SelectItem><SelectItem value="light">Light</SelectItem></SelectContent>
                  </Select>
                  <Select value={requirementDraft.period_pattern} onValueChange={(value: TimetableSubjectRequirement['period_pattern']) => setRequirementDraft((current) => ({ ...current, period_pattern: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Single / Double / Triple" /></SelectTrigger>
                    <SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="double">Double</SelectItem><SelectItem value="triple">Triple</SelectItem></SelectContent>
                  </Select>
                  <Input value={requirementDraft.weekly_periods} onChange={(event) => setRequirementDraft((current) => ({ ...current, weekly_periods: event.target.value }))} className={fieldClassName} placeholder="Weekly periods" type="number" min="1" />
                  <Select value={requirementDraft.preferred_session} onValueChange={(value: TimetableSubjectRequirement['preferred_session']) => setRequirementDraft((current) => ({ ...current, preferred_session: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Preferred session" /></SelectTrigger>
                    <SelectContent><SelectItem value="morning">Morning</SelectItem><SelectItem value="afternoon">Afternoon</SelectItem><SelectItem value="any">Any</SelectItem></SelectContent>
                  </Select>
                  <Select value={requirementDraft.teacher_user_id} onValueChange={(value) => setRequirementDraft((current) => ({ ...current, teacher_user_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Assigned teacher" /></SelectTrigger>
                    <SelectContent>{teacherProfiles.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input value={requirementDraft.academic_year} onChange={(event) => setRequirementDraft((current) => ({ ...current, academic_year: event.target.value }))} className={fieldClassName} placeholder="Academic year" />
                    <Input value={requirementDraft.term} onChange={(event) => setRequirementDraft((current) => ({ ...current, term: event.target.value }))} className={fieldClassName} placeholder="Term" />
                  </div>
                </div>
                <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!canManage || savingRequirement}>
                  {savingRequirement ? 'Saving requirement...' : 'Add Requirement'}
                </Button>
              </form>

              <div className="mt-5 space-y-3">
                {selectedClassRequirements.length ? selectedClassRequirements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{item.subject_name}</p>
                      <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">{item.priority}</Badge>
                      <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{item.period_pattern}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.weekly_periods} weekly periods · {item.preferred_session} session · {item.assigned_teacher_name || 'Teacher not mapped'}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">No timetable requirements saved for the selected class yet.</div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <Card title="Teacher Load Settings" description="Keep teacher deployment realistic by setting class and period limits used during generation.">
            <div className="space-y-4">
              {teacherProfiles.length ? teacherProfiles.map((teacher) => {
                const existing = teacherSettingLookup.get(teacher.id)
                const currentAssignmentCount = data.assignments.filter((item) => item.teacher_user_id === teacher.id).length
                return (
                  <TeacherSettingRow
                    key={teacher.id}
                    teacher={teacher}
                    existing={existing}
                    assignmentCount={currentAssignmentCount}
                    saving={savingTeacherSettings}
                    onSave={handleSaveTeacherSetting}
                  />
                )
              }) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">No teacher or leadership profiles are available yet.</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card title="Generate Timetable" description="Use saved class rules, teacher limits, and the school day structure to build a conflict-aware timetable.">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Input value={requirementDraft.academic_year} onChange={(event) => setRequirementDraft((current) => ({ ...current, academic_year: event.target.value }))} className={fieldClassName} placeholder="Academic year" />
                <Input value={requirementDraft.term} onChange={(event) => setRequirementDraft((current) => ({ ...current, term: event.target.value }))} className={fieldClassName} placeholder="Term" />
                <div className="grid gap-3">
                  <Button type="button" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={!canManage || generating || aiWorking} onClick={() => void handleGenerateTimetable('rules')}>
                    {generating ? 'Generating...' : 'Generate with Rules'}
                  </Button>
                  <Button type="button" variant="outline" className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" disabled={!canManage || generating || aiWorking} onClick={() => void handleGenerateTimetable('ai')}>
                    {generating || aiWorking ? 'Preparing AI...' : 'Generate with AI Assist'}
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Draft Approval</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Review the generated draft, then approve it to save the timetable into the live database for classes, teachers, students, and parents to use.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    disabled={!draftEntries.length || savingApprovedTimetable || generating}
                    onClick={() => void approveAndSaveTimetable()}
                  >
                    {savingApprovedTimetable ? 'Saving approved timetable...' : 'Approve and Save Timetable'}
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Draft Periods</p>
                    <p className="mt-2 text-2xl font-bold text-white">{draftEntries.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Draft Type</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-200">{draftMode ? (draftMode === 'ai' ? 'AI Assist' : 'Rules') : 'None'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Approval Roles</p>
                    <p className="mt-2 text-sm font-medium text-slate-200">DOS, SuperAdmin, Headmaster, HOD</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="text-lg font-semibold text-white">Generation Rules Enforced</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <RuleChip text="Core subjects are placed in morning slots first." />
                  <RuleChip text="Light subjects are pushed to afternoon when possible." />
                  <RuleChip text="Single, double, and triple periods stay grouped together." />
                  <RuleChip text="A teacher cannot appear in two classes in the same period." />
                  <RuleChip text="Teacher max periods per day are respected." />
                  <RuleChip text="Uncovered or conflicting slots are reported for review." />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="h-5 w-5 text-amber-300" />
                  <h3 className="text-lg font-semibold text-white">Conflict Report</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {generationConflicts.length ? generationConflicts.map((item) => (
                    <div key={item} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">{item}</div>
                  )) : (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">No conflicts were detected in the latest generation run.</div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="text-lg font-semibold text-white">AI Generation Notes</h3>
                <div className="mt-4 space-y-3">
                  {lastAiGenerationNotes.length ? (
                    lastAiGenerationNotes.map((item) => (
                      <div key={item} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                        {item}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
                      AI generation notes will appear here after you run AI-assisted timetable generation.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Timetable Support</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Use AI to explain conflicts, suggest better sequencing, or review timetable readiness before the DOS publishes the schedule.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"
                      disabled={aiWorking}
                      onClick={() => void requestAiSupport('Create a short DOS timetable readiness summary for the current academic year and term.')}
                    >
                      {aiWorking ? 'Thinking...' : 'AI Readiness Check'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                      disabled={aiWorking}
                      onClick={() => void handleAiConflictReview()}
                    >
                      {aiWorking ? 'Thinking...' : 'Explain Conflicts'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                      disabled={aiWorking || !generationConflicts.length}
                      onClick={() => void requestAiConflictSuggestions()}
                    >
                      {aiWorking ? 'Thinking...' : 'Get Fix Suggestions'}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,auto]">
                  <Input
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    className={fieldClassName}
                    placeholder="Ask AI to rebalance teachers, improve morning core placement, or review timetable gaps..."
                  />
                  <Button
                    type="button"
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    disabled={aiWorking || !aiPrompt.trim()}
                    onClick={() => void requestAiSupport(aiPrompt)}
                  >
                    {aiWorking ? 'Working...' : 'Ask Timetable AI'}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    'Suggest the best next fix for teacher overload.',
                    'Explain whether core subjects are balanced well in the morning.',
                    'Recommend how DOS should resolve timetable gaps before publishing.',
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"
                      disabled={aiWorking}
                      onClick={() => void requestAiSupport(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>

                {aiError ? (
                  <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{aiError}</div>
                ) : null}

                {aiAdvice ? (
                  <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm leading-6 text-slate-100 whitespace-pre-wrap">
                    {aiAdvice}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
                    AI timetable guidance will appear here after you run a readiness check, ask a custom question, or review conflicts.
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {aiConflictSuggestions.length ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        disabled={applyingAllSuggestions || generating}
                        onClick={() => void applyAllSafeSuggestions(false)}
                      >
                        {applyingAllSuggestions ? 'Applying...' : 'Apply All Safe Suggestions'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                        disabled={applyingAllSuggestions || generating}
                        onClick={() => void applyAllSafeSuggestions(true)}
                      >
                        {applyingAllSuggestions || generating ? 'Working...' : 'Regenerate After Apply'}
                      </Button>
                    </div>
                  ) : null}

                  {aiConflictSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold text-white">{suggestion.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{suggestion.reason}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">{suggestion.change}</Badge>
                            <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{suggestion.target_type}</Badge>
                            <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{String(suggestion.value)}</Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          disabled={applyingSuggestionId === suggestion.id || applyingAllSuggestions}
                          onClick={() => void applyAiSuggestion(suggestion)}
                        >
                          {applyingSuggestionId === suggestion.id ? 'Applying...' : 'Apply Suggestion'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          <Card title="View and Export Timetable" description="Inspect the generated timetable by class, teacher, or day, then export the current filtered view.">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className={fieldClassName}><SelectValue placeholder="Filter by class" /></SelectTrigger>
                  <SelectContent>{data.classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className={fieldClassName}><SelectValue placeholder="Filter by teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teacherProfiles.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className={fieldClassName}><SelectValue placeholder="Filter by day" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    {workingDays.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-800">
                <div className="grid grid-cols-[1.1fr,0.8fr,0.5fr,1fr,1fr] gap-4 border-b border-slate-800 bg-slate-950/90 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span>Class</span>
                  <span>Day</span>
                  <span>Period</span>
                  <span>Subject</span>
                  <span>Teacher</span>
                </div>
                <div className="divide-y divide-slate-800 bg-slate-950/60">
                  {filteredEntries.length ? filteredEntries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[1.1fr,0.8fr,0.5fr,1fr,1fr] gap-4 px-4 py-3 text-sm text-slate-200">
                      <span>{entry.class_name}</span>
                      <span>{entry.day}</span>
                      <span>{entry.period_number}</span>
                      <span>{entry.subject_name}</span>
                      <span>{entry.teacher_name}</span>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-sm text-slate-400">No timetable entries match the current filter yet.</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card title="Workflow Diagram" description="A visual operating guide for the DOS timetable module and leadership review cycle.">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="text-lg font-semibold text-white">Step-by-Step Workflow</h3>
                <div className="mt-4 space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div key={step} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-200">{index + 1}</div>
                      <p className="text-sm text-slate-200">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="text-lg font-semibold text-white">Conflict-Free Logic</h3>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <DiagramBlock icon={<Route className="h-4 w-4" />} title="Input Data">
                    Classes, subjects, teacher assignments, and the school day structure are loaded first.
                  </DiagramBlock>
                  <DiagramBlock icon={<Sparkles className="h-4 w-4" />} title="Core Before Light">
                    Core and double/triple requirements are placed first in morning slots, then lighter subjects fill the remaining timetable.
                  </DiagramBlock>
                  <DiagramBlock icon={<TriangleAlert className="h-4 w-4" />} title="Teacher Clash Prevention">
                    Every class-period-teacher combination is checked before assignment, so one teacher cannot be scheduled in two classes at the same time.
                  </DiagramBlock>
                  <DiagramBlock icon={<TimerReset className="h-4 w-4" />} title="Review and Export">
                    Any uncovered slots or teacher load warnings are listed for leadership review before final export.
                  </DiagramBlock>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {!canManage ? (
        <Card title="Role Access" description="You can review timetable output and workflow guidance, but setup and generation remain leadership-led.">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
            Your current role can monitor the timetable module, export the current view, and coordinate around movement-sensitive class work without changing the generation rules.
          </div>
        </Card>
      ) : null}
    </div>
  )
}

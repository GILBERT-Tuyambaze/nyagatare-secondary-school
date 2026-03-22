import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import {
  assignStudentToClass,
  createClassTeacherAssignment,
  createClassroom,
  deleteClassTeacherAssignment,
  getAccessProfiles,
  getActivityLogs,
  getClasses,
  getClassStudents,
  getClassTeacherAssignments,
  getDisciplineCases,
  getLearningResources,
  getStudents,
  getSubjects,
  getTimetableEntries,
  logActivity,
  updateClassroom,
  updateClassTeacherAssignment,
} from '@/services/firestoreService'
import { ActivityLog, ClassTeacherAssignment, DisciplineCase, LearningResource, SchoolSubject, Student, TimetableEntry } from '@/types/database'
import { Card } from '../components/Card'
import { Classroom, SystemUser } from '../types'

type ClassOperationsState = {
  classes: Classroom[]
  classStudents: Array<{ id: string; class_id: string; student_id: string }>
  students: Student[]
  profiles: SystemUser[]
  subjects: SchoolSubject[]
  assignments: ClassTeacherAssignment[]
  resources: LearningResource[]
  disciplineCases: DisciplineCase[]
  activityLogs: ActivityLog[]
  timetableEntries: TimetableEntry[]
}

type ClassDraft = {
  name: string
  department: string
  head_teacher_id: string
  subject_id: string
  academic_year: string
  term: string
  student_leader_id: string
}

type AssignmentDraft = {
  class_id: string
  teacher_user_id: string
  subject_id: string
  academic_year: string
  term: string
  is_class_teacher: boolean
  can_invite_students: boolean
  can_invite_parents: boolean
  can_change_class: boolean
}

type StudentPlacementDraft = {
  class_id: string
  student_id: string
}

const emptyState: ClassOperationsState = {
  classes: [],
  classStudents: [],
  students: [],
  profiles: [],
  subjects: [],
  assignments: [],
  resources: [],
  disciplineCases: [],
  activityLogs: [],
  timetableEntries: [],
}

const roleFocus: Record<string, string[]> = {
  SuperAdmin: ['Create or restructure classes', 'Assign teachers across streams', 'Approve student movement and special overrides'],
  Headmaster: ['Supervise class quality', 'Approve deployment changes', 'Keep learning delivery aligned across classes'],
  DOS: ['Build classes and assign teachers', 'Map subjects to teachers', 'Enable special teacher permissions where needed'],
  HOD: ['Support teacher deployment', 'Track subject coverage', 'Strengthen department performance inside classes'],
  DOD: ['Place or move students', 'Review discipline context before movement', 'Coordinate support-sensitive class placement'],
}

const fieldClassName = 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500'

export default function ClassOperationsPage() {
  const { accessProfile, user } = useAuth()
  const [data, setData] = useState<ClassOperationsState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [savingClass, setSavingClass] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [savingPlacement, setSavingPlacement] = useState(false)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [classDraft, setClassDraft] = useState<ClassDraft>({
    name: '',
    department: '',
    head_teacher_id: '',
    subject_id: '',
    academic_year: '2026',
    term: 'Term 1',
    student_leader_id: '',
  })
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>({
    class_id: '',
    teacher_user_id: '',
    subject_id: '',
    academic_year: '2026',
    term: 'Term 1',
    is_class_teacher: false,
    can_invite_students: false,
    can_invite_parents: false,
    can_change_class: false,
  })
  const [placementDraft, setPlacementDraft] = useState<StudentPlacementDraft>({ class_id: '', student_id: '' })

  const canCreateClass = ['SuperAdmin', 'Headmaster', 'DOS'].includes(accessProfile.role)
  const canAssignTeacher = ['SuperAdmin', 'Headmaster', 'DOS', 'HOD'].includes(accessProfile.role)
  const canAssignStudent = ['SuperAdmin', 'Headmaster', 'DOS', 'DOD'].includes(accessProfile.role)

  const load = async () => {
    setLoading(true)
    try {
      const [classes, classStudents, students, profiles, subjects, assignments, resources, disciplineCases, activityLogs, timetableEntries] =
        await Promise.all([
          getClasses(),
          getClassStudents(),
          getStudents(),
          getAccessProfiles(),
          getSubjects(),
          getClassTeacherAssignments(),
          getLearningResources(),
          getDisciplineCases(),
          getActivityLogs(),
          getTimetableEntries(),
        ])

      setData({ classes, classStudents, students, profiles, subjects, assignments, resources, disciplineCases, activityLogs, timetableEntries })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!selectedClassId && data.classes[0]?.id) setSelectedClassId(data.classes[0].id)
  }, [data.classes, selectedClassId])

  useEffect(() => {
    if (!assignmentDraft.class_id && data.classes[0]?.id) {
      setAssignmentDraft((current) => ({ ...current, class_id: data.classes[0].id }))
    }
    if (!placementDraft.class_id && data.classes[0]?.id) {
      setPlacementDraft((current) => ({ ...current, class_id: data.classes[0].id }))
    }
  }, [assignmentDraft.class_id, data.classes, placementDraft.class_id])

  const actorUid = user?.uid || accessProfile.email || 'system-user'
  const actorName = accessProfile.displayName
  const roleChecklist = roleFocus[accessProfile.role] || ['Leadership actions for this role are not configured yet.']

  const teacherProfiles = useMemo(
    () => data.profiles.filter((item) => ['Teacher', 'HOD', 'Headmaster'].includes(item.role)),
    [data.profiles]
  )
  const studentCandidates = useMemo(() => data.students.filter((item) => item.status === 'active'), [data.students])

  const selectedClass = data.classes.find((item) => item.id === selectedClassId) || data.classes[0]
  const classAssignments = data.assignments.filter((item) => item.class_id === selectedClass?.id)
  const classStudentIds = data.classStudents.filter((item) => item.class_id === selectedClass?.id).map((item) => item.student_id)
  const classStudents = data.students.filter((item) => classStudentIds.includes(item.id))
  const classResources = data.resources.filter((item) => item.class_id === selectedClass?.id)
  const classDiscipline = data.disciplineCases.filter((item) => item.class_id === selectedClass?.id)
  const classTimetableEntries = data.timetableEntries.filter((item) => item.class_id === selectedClass?.id)
  const recentActivity = data.activityLogs
    .filter(
      (item) =>
        classAssignments.some((assignment) => assignment.id === item.target_id) ||
        classResources.some((resource) => resource.id === item.target_id) ||
        classDiscipline.some((caseItem) => caseItem.id === item.target_id) ||
        (selectedClass && item.summary.toLowerCase().includes(selectedClass.name.toLowerCase()))
    )
    .slice(0, 8)
  const movementHistory = data.activityLogs
    .filter(
      (item) =>
        ['student_class_change', 'student_class_assignment'].includes(item.action) &&
        !!selectedClass &&
        item.summary.toLowerCase().includes(selectedClass.name.toLowerCase())
    )
    .slice(0, 10)

  const subjectCoverage = useMemo(() => new Set(classAssignments.map((item) => item.subject_name)).size, [classAssignments])
  const availableStudentLeaders = classStudents.filter((item) => item.status === 'active')
  const timetableClassCoverage = new Set(data.timetableEntries.map((item) => item.class_id)).size
  const timetableTeacherCoverage = new Set(data.timetableEntries.map((item) => item.teacher_user_id)).size

  const handleCreateClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreateClass || !classDraft.name.trim() || !classDraft.department.trim() || !classDraft.head_teacher_id || !classDraft.subject_id) return

    setSavingClass(true)
    try {
      const headTeacher = teacherProfiles.find((item) => item.id === classDraft.head_teacher_id)
      const subject = data.subjects.find((item) => item.id === classDraft.subject_id)
      const created = await createClassroom({
        name: classDraft.name.trim(),
        department: classDraft.department.trim(),
        created_by: actorUid,
        head_teacher_id: classDraft.head_teacher_id,
        student_leader_id: classDraft.student_leader_id || undefined,
      })

      await createClassTeacherAssignment({
        class_id: created.id,
        teacher_user_id: classDraft.head_teacher_id,
        teacher_name: headTeacher?.fullName || 'Teacher',
        subject_id: classDraft.subject_id,
        subject_name: subject?.name || 'Subject',
        academic_year: classDraft.academic_year,
        term: classDraft.term,
        can_invite_students: false,
        can_invite_parents: false,
        can_change_class: false,
      })

      await logActivity({
        action: 'class_create',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'classes',
        target_id: created.id,
        summary: `Created ${created.name} with ${headTeacher?.fullName || 'assigned leadership'} as class teacher for ${subject?.name || 'their subject'}.`,
      })

      setClassDraft({
        name: '',
        department: '',
        head_teacher_id: '',
        subject_id: '',
        academic_year: '2026',
        term: 'Term 1',
        student_leader_id: '',
      })
      await load()
      setSelectedClassId(created.id)
    } finally {
      setSavingClass(false)
    }
  }

  const handleCreateAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canAssignTeacher || !assignmentDraft.class_id || !assignmentDraft.teacher_user_id || !assignmentDraft.subject_id) return

    setSavingAssignment(true)
    try {
      const teacher = teacherProfiles.find((item) => item.id === assignmentDraft.teacher_user_id)
      const subject = data.subjects.find((item) => item.id === assignmentDraft.subject_id)
      const targetClass = data.classes.find((item) => item.id === assignmentDraft.class_id)
      const assignmentPayload = {
        class_id: assignmentDraft.class_id,
        teacher_user_id: assignmentDraft.teacher_user_id,
        teacher_name: teacher?.fullName || 'Teacher',
        subject_id: assignmentDraft.subject_id,
        subject_name: subject?.name || 'Subject',
        academic_year: assignmentDraft.academic_year,
        term: assignmentDraft.term,
        can_invite_students: assignmentDraft.can_invite_students,
        can_invite_parents: assignmentDraft.can_invite_parents,
        can_change_class: assignmentDraft.can_change_class,
      }

      const saved = editingAssignmentId
        ? await updateClassTeacherAssignment(editingAssignmentId, assignmentPayload)
        : await createClassTeacherAssignment(assignmentPayload)

      if (assignmentDraft.is_class_teacher) {
        await updateClassroom(assignmentDraft.class_id, {
          head_teacher_id: assignmentDraft.teacher_user_id,
        })
      }

      await logActivity({
        action: editingAssignmentId ? 'teacher_assignment_update' : 'teacher_assignment',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'class_teacher_assignments',
        target_id: saved.id,
        summary: `${editingAssignmentId ? 'Updated' : assignmentDraft.is_class_teacher ? 'Assigned class teacher' : 'Assigned'} ${teacher?.fullName || 'teacher'} to ${subject?.name || 'subject'} in ${targetClass?.name || 'the selected class'}.`,
      })

      setAssignmentDraft({
        class_id: assignmentDraft.class_id,
        teacher_user_id: '',
        subject_id: '',
        academic_year: '2026',
        term: 'Term 1',
        is_class_teacher: false,
        can_invite_students: false,
        can_invite_parents: false,
        can_change_class: false,
      })
      setEditingAssignmentId(null)
      await load()
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleEditAssignment = (assignment: ClassTeacherAssignment) => {
    const targetClass = data.classes.find((item) => item.id === assignment.class_id)
    setEditingAssignmentId(assignment.id)
    setSelectedClassId(assignment.class_id)
    setAssignmentDraft({
      class_id: assignment.class_id,
      teacher_user_id: assignment.teacher_user_id,
      subject_id: assignment.subject_id,
      academic_year: assignment.academic_year,
      term: assignment.term,
      is_class_teacher: targetClass?.head_teacher_id === assignment.teacher_user_id,
      can_invite_students: assignment.can_invite_students,
      can_invite_parents: assignment.can_invite_parents,
      can_change_class: assignment.can_change_class,
    })
  }

  const resetAssignmentEditor = () => {
    setEditingAssignmentId(null)
    setAssignmentDraft((current) => ({
      class_id: current.class_id || data.classes[0]?.id || '',
      teacher_user_id: '',
      subject_id: '',
      academic_year: '2026',
      term: 'Term 1',
      is_class_teacher: false,
      can_invite_students: false,
      can_invite_parents: false,
      can_change_class: false,
    }))
  }

  const handleDeleteAssignment = async (assignment: ClassTeacherAssignment) => {
    const targetClass = data.classes.find((item) => item.id === assignment.class_id)
    const isCurrentClassTeacher = targetClass?.head_teacher_id === assignment.teacher_user_id

    if (isCurrentClassTeacher) {
      window.alert('Reassign the class teacher first, then delete this teaching assignment.')
      return
    }

    const confirmed = window.confirm(
      `Delete ${assignment.teacher_name}'s ${assignment.subject_name} assignment from ${targetClass?.name || 'this class'}?`
    )

    if (!confirmed) {
      return
    }

    setSavingAssignment(true)
    try {
      await deleteClassTeacherAssignment(assignment.id)
      await logActivity({
        action: 'teacher_assignment_delete',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'class_teacher_assignments',
        target_id: assignment.id,
        summary: `Removed ${assignment.teacher_name} from ${assignment.subject_name} in ${targetClass?.name || 'the selected class'}.`,
      })

      if (editingAssignmentId === assignment.id) {
        resetAssignmentEditor()
      }

      await load()
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleAssignStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canAssignStudent || !placementDraft.class_id || !placementDraft.student_id) return

    setSavingPlacement(true)
    try {
      const student = data.students.find((item) => item.id === placementDraft.student_id)
      const targetClass = data.classes.find((item) => item.id === placementDraft.class_id)
      const previousMembership = data.classStudents.find((item) => item.student_id === placementDraft.student_id)
      const previousClass = data.classes.find((item) => item.id === previousMembership?.class_id)

      const placed = await assignStudentToClass({
        class_id: placementDraft.class_id,
        student_id: placementDraft.student_id,
      })

      await logActivity({
        action: previousClass ? 'student_class_change' : 'student_class_assignment',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'class_students',
        target_id: placed.id,
        summary: `${student?.first_name || 'Student'} ${student?.last_name || ''} ${previousClass ? `moved from ${previousClass.name}` : 'assigned'} to ${targetClass?.name || 'the selected class'}.`.trim(),
      })

      setPlacementDraft((current) => ({ ...current, student_id: '' }))
      await load()
      setSelectedClassId(placementDraft.class_id)
    } finally {
      setSavingPlacement(false)
    }
  }

  if (loading) {
    return (
      <Card title="Class Operations" description="Loading class responsibilities, assignments, and oversight data.">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">Loading class operations...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Class Operations" description="Create classes, deploy teachers, place students, and keep class delivery healthy.">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Managed Classes</p>
              <p className="mt-2 text-3xl font-bold text-white">{data.classes.length}</p>
              <p className="mt-2 text-sm text-slate-300">Digital class spaces under leadership visibility.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Teacher Assignments</p>
              <p className="mt-2 text-3xl font-bold text-cyan-200">{data.assignments.length}</p>
              <p className="mt-2 text-sm text-slate-300">Subject deployment across classes and terms.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Student Placements</p>
              <p className="mt-2 text-3xl font-bold text-white">{data.classStudents.length}</p>
              <p className="mt-2 text-sm text-slate-300">Active class memberships for current learners.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Open Conduct Cases</p>
              <p className="mt-2 text-3xl font-bold text-white">{data.disciplineCases.filter((item) => item.status !== 'resolved').length}</p>
              <p className="mt-2 text-sm text-slate-300">Support-sensitive cases to review before movement.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Leadership Role Focus</h3>
                <p className="mt-2 text-sm text-slate-400">The operations in this desk adapt to the responsibilities of {accessProfile.role}.</p>
              </div>
              <Badge className="w-fit bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">{accessProfile.role}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {roleChecklist.map((item) => (
                <Badge key={item} className="bg-white/10 text-slate-100 hover:bg-white/10">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Timetable Readiness</h3>
                  <p className="mt-2 text-sm text-slate-400">See whether class deployment already has timetable coverage before you adjust class teachers, student placement, or subject mapping.</p>
                </div>
                <Link
                  to="/system/timetable"
                  className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:border-cyan-400/40"
                >
                  Open Timetable Studio
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm text-slate-400">Classes Scheduled</p>
                  <p className="mt-2 text-2xl font-bold text-white">{timetableClassCoverage}</p>
                  <p className="mt-2 text-xs text-slate-400">Classes already carrying saved timetable entries.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm text-slate-400">Teachers Scheduled</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-200">{timetableTeacherCoverage}</p>
                  <p className="mt-2 text-xs text-slate-400">Teachers already tied to timetable periods.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm text-slate-400">Selected Class Periods</p>
                  <p className="mt-2 text-2xl font-bold text-white">{classTimetableEntries.length}</p>
                  <p className="mt-2 text-xs text-slate-400">Periods currently published for the active class selection.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <h3 className="text-lg font-semibold text-white">Timetable Quick Actions</h3>
              <p className="mt-2 text-sm text-slate-400">Jump straight into the scheduling work that supports class creation and teacher deployment.</p>
              <div className="mt-4 grid gap-3">
                <Link to="/system/timetable" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-slate-800 hover:text-white">
                  Generate or review the full school timetable
                </Link>
                <Link to="/system/timetable" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-slate-800 hover:text-white">
                  Validate teacher conflicts before changing class assignments
                </Link>
                <Link to="/system/academics" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 transition-colors hover:bg-slate-800 hover:text-white">
                  Check the published class timetable from the academic workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr,0.95fr]">
        <Card title="Build and Assign" description="Core setup actions to keep the class system complete and operational.">
          <div className="space-y-5">
            {canCreateClass ? (
              <form onSubmit={handleCreateClass} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Create Class</h3>
                    <p className="text-sm text-slate-400">Open a new class space with a department and class leadership anchor.</p>
                  </div>
                  <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={savingClass}>
                    {savingClass ? 'Creating...' : 'Create Class'}
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input value={classDraft.name} onChange={(event) => setClassDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Class name" className={fieldClassName} />
                  <Input value={classDraft.department} onChange={(event) => setClassDraft((current) => ({ ...current, department: event.target.value }))} placeholder="Department" className={fieldClassName} />
                  <Select value={classDraft.head_teacher_id} onValueChange={(value) => setClassDraft((current) => ({ ...current, head_teacher_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Head teacher" /></SelectTrigger>
                    <SelectContent>
                      {teacherProfiles.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.fullName} - {teacher.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={classDraft.subject_id} onValueChange={(value) => setClassDraft((current) => ({ ...current, subject_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Subject taught by class teacher" /></SelectTrigger>
                    <SelectContent>
                      {data.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={classDraft.academic_year} onChange={(event) => setClassDraft((current) => ({ ...current, academic_year: event.target.value }))} placeholder="Academic year" className={fieldClassName} />
                  <Input value={classDraft.term} onChange={(event) => setClassDraft((current) => ({ ...current, term: event.target.value }))} placeholder="Term" className={fieldClassName} />
                  <Select value={classDraft.student_leader_id} onValueChange={(value) => setClassDraft((current) => ({ ...current, student_leader_id: value === '__none__' ? '' : value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Student leader (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No student leader yet</SelectItem>
                      {studentCandidates.map((student) => (
                        <SelectItem key={student.id} value={student.id}>{student.first_name} {student.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            ) : null}

            {canAssignTeacher ? (
              <form onSubmit={handleCreateAssignment} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Assign Teacher to Class</h3>
                    <p className="text-sm text-slate-400">Map a teacher to a class and subject, then enable only the permissions that role should carry there.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingAssignmentId ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"
                        onClick={resetAssignmentEditor}
                      >
                        Cancel edit
                      </Button>
                    ) : null}
                    <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={savingAssignment}>
                      {savingAssignment ? (editingAssignmentId ? 'Saving...' : 'Assigning...') : editingAssignmentId ? 'Save Assignment' : 'Assign Teacher'}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Select value={assignmentDraft.class_id} onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, class_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {data.classes.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={assignmentDraft.teacher_user_id} onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, teacher_user_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Teacher" /></SelectTrigger>
                    <SelectContent>
                      {teacherProfiles.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.fullName} - {teacher.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={assignmentDraft.subject_id} onValueChange={(value) => setAssignmentDraft((current) => ({ ...current, subject_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      {data.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={assignmentDraft.academic_year} onChange={(event) => setAssignmentDraft((current) => ({ ...current, academic_year: event.target.value }))} className={fieldClassName} placeholder="Academic year" />
                  <Input value={assignmentDraft.term} onChange={(event) => setAssignmentDraft((current) => ({ ...current, term: event.target.value }))} className={fieldClassName} placeholder="Term" />
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-white">Teacher class permissions</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-300">
                      <label className="flex items-center gap-3"><input type="checkbox" checked={assignmentDraft.is_class_teacher} onChange={(event) => setAssignmentDraft((current) => ({ ...current, is_class_teacher: event.target.checked }))} />Make this teacher the class teacher</label>
                      <label className="flex items-center gap-3"><input type="checkbox" checked={assignmentDraft.can_invite_students} onChange={(event) => setAssignmentDraft((current) => ({ ...current, can_invite_students: event.target.checked }))} />Allow student invites</label>
                      <label className="flex items-center gap-3"><input type="checkbox" checked={assignmentDraft.can_invite_parents} onChange={(event) => setAssignmentDraft((current) => ({ ...current, can_invite_parents: event.target.checked }))} />Allow parent invites</label>
                      <label className="flex items-center gap-3"><input type="checkbox" checked={assignmentDraft.can_change_class} onChange={(event) => setAssignmentDraft((current) => ({ ...current, can_change_class: event.target.checked }))} />Allow class change action</label>
                    </div>
                  </div>
                </div>
                {editingAssignmentId ? (
                  <p className="mt-4 text-sm text-cyan-200">
                    Editing an existing class assignment. Save changes here to keep subject deployment accurate without recreating the record.
                  </p>
                ) : null}
              </form>
            ) : null}

            {canAssignStudent ? (
              <form onSubmit={handleAssignStudent} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Place or Move Student</h3>
                    <p className="text-sm text-slate-400">Assign a learner to a class, or move them between classes while keeping leadership visibility.</p>
                  </div>
                  <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={savingPlacement}>
                    {savingPlacement ? 'Saving...' : 'Save Placement'}
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Select value={placementDraft.class_id} onValueChange={(value) => setPlacementDraft((current) => ({ ...current, class_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      {data.classes.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={placementDraft.student_id} onValueChange={(value) => setPlacementDraft((current) => ({ ...current, student_id: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Student" /></SelectTrigger>
                    <SelectContent>
                      {studentCandidates.map((student) => (
                        <SelectItem key={student.id} value={student.id}>{student.first_name} {student.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            ) : null}
          </div>
        </Card>

        <Card title="Class Leadership Board" description="Choose a class and review readiness, deployment, student placement, and support signals.">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {data.classes.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={selectedClass?.id === item.id ? 'default' : 'outline'}
                  className={
                    selectedClass?.id === item.id
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white'
                  }
                  onClick={() => setSelectedClassId(item.id)}
                >
                  {item.name}
                </Button>
              ))}
            </div>

            {selectedClass ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-sm text-slate-400">Students</p>
                    <p className="mt-2 text-2xl font-bold text-white">{classStudents.length}</p>
                    <p className="mt-2 text-sm text-slate-300">{selectedClass.department} class roster</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-sm text-slate-400">Subject Coverage</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-200">{subjectCoverage}</p>
                    <p className="mt-2 text-sm text-slate-300">Distinct subjects assigned to this class</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-sm text-slate-400">Resource Flow</p>
                    <p className="mt-2 text-2xl font-bold text-white">{classResources.length}</p>
                    <p className="mt-2 text-sm text-slate-300">Assignments, notes, packages, and materials</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Class Teacher</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {teacherProfiles.find((teacher) => teacher.id === selectedClass.head_teacher_id)?.fullName || 'Not assigned yet'}
                      </p>
                    </div>
                    <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">
                      {
                        classAssignments.find((assignment) => assignment.teacher_user_id === selectedClass.head_teacher_id)?.subject_name ||
                        'Must teach in this class'
                      }
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    The class teacher is always tied to a real teaching assignment in this class. Promote a teacher through the assignment form only when they teach a subject here.
                  </p>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">Teacher and Subject Deployment</h3>
                      <div className="mt-4 space-y-3">
                        {classAssignments.length === 0 ? <p className="text-sm text-slate-400">No teacher assignments are attached to this class yet.</p> : null}
                        {classAssignments.map((assignment) => (
                          <div key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-white">{assignment.subject_name}</p>
                                <p className="mt-1 text-sm text-slate-400">{assignment.teacher_name}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {assignment.can_invite_students ? <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">Student invite</Badge> : null}
                                {assignment.can_invite_parents ? <Badge className="bg-sky-500/15 text-sky-200 hover:bg-sky-500/15">Parent invite</Badge> : null}
                                {assignment.can_change_class ? <Badge className="bg-amber-500/15 text-amber-200 hover:bg-amber-500/15">Class change</Badge> : null}
                              </div>
                            </div>
                            {canAssignTeacher ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                                  onClick={() => handleEditAssignment(assignment)}
                                >
                                  Edit assignment
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white"
                                  onClick={() => void handleDeleteAssignment(assignment)}
                                  disabled={savingAssignment}
                                >
                                  Delete assignment
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">Student Movement and Support Watch</h3>
                      <div className="mt-4 space-y-3">
                        {classStudents.map((student) => {
                          const studentCases = classDiscipline.filter((item) => item.student_id === student.id)
                          return (
                            <div key={student.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium text-white">{student.first_name} {student.last_name}</p>
                                  <p className="mt-1 text-sm text-slate-400">{student.email || student.phone || 'No direct contact saved'}</p>
                                </div>
                                <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                                  {studentCases.length} discipline note{studentCases.length === 1 ? '' : 's'}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                        {classStudents.length === 0 ? <p className="text-sm text-slate-400">No students have been placed into this class yet.</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">What This Class Still Needs</h3>
                      <div className="mt-4 space-y-3 text-sm text-slate-300">
                        <p>{classAssignments.length === 0 ? 'Teacher assignment still missing.' : 'Teacher deployment is in place.'}</p>
                        <p>{classStudents.length === 0 ? 'Student roster still missing.' : 'Student roster is active.'}</p>
                        <p>{classResources.length === 0 ? 'Learning resources have not started flowing yet.' : 'Learning materials are already being published.'}</p>
                        <p>{availableStudentLeaders.length === 0 ? 'Student leadership is not yet visible in this class roster.' : 'Student leadership can be assigned from the current roster.'}</p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">Leadership Actions</h3>
                      <div className="mt-4 grid gap-3">
                        <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Link to="/system/academics">Open Class Workspace</Link></Button>
                        <Button asChild variant="outline" className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"><Link to="/system/discipline">Open Discipline Desk</Link></Button>
                        <Button asChild variant="outline" className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"><Link to="/system/users">Open User Directory</Link></Button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">Student Movement History</h3>
                      <p className="mt-2 text-sm text-slate-400">
                        Auditable movement records for learners assigned into or moved through this class.
                      </p>
                      <div className="mt-4 space-y-3">
                        {movementHistory.length === 0 ? <p className="text-sm text-slate-400">No student movement has been logged for this class yet.</p> : null}
                        {movementHistory.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-white">{item.actor_name}</p>
                              <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                                {item.action === 'student_class_change' ? 'Moved' : 'Placed'}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                            <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                      <h3 className="text-lg font-semibold text-white">Recent Class Actions</h3>
                      <div className="mt-4 space-y-3">
                        {recentActivity.length === 0 ? <p className="text-sm text-slate-400">No recent logged actions for this class yet.</p> : null}
                        {recentActivity.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-white">{item.actor_name}</p>
                              <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                No classes are available yet. Use the create class form to open the first class space.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

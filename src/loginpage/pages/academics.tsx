import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import {
  createChatMessage,
  createLearningResource,
  createStudentMark,
  getAccessProfiles,
  getActivityLogs,
  getChatMessages,
  getChatThreads,
  getClasses,
  getClassStudents,
  getClassTeacherAssignments,
  getDisciplineCases,
  getLearningResources,
  getStudentMarks,
  getStudents,
  getSubjects,
  getTimetableEntries,
  logActivity,
  updateStudentMark,
} from '@/services/firestoreService'
import { ActivityLog, ChatMessage, ChatThread, ClassTeacherAssignment, DisciplineCase, LearningResource, SchoolSubject, Student, StudentMark, TimetableEntry } from '@/types/database'
import { Card } from '../components/Card'
import { ClassChatPanel } from '../components/ClassChatPanel'
import { ClassSummaryCards } from '../components/ClassSummaryCards'
import { DisciplinePreview } from '../components/DisciplinePreview'
import { LearningResourcesPanel } from '../components/LearningResourcesPanel'
import { MarksCenter } from '../components/MarksCenter'
import { TimetablePanel } from '../components/TimetablePanel'
import { Classroom, SystemUser } from '../types'

type AcademicsState = {
  profiles: SystemUser[]
  classes: Classroom[]
  classStudents: Array<{ id: string; class_id: string; student_id: string }>
  students: Student[]
  subjects: SchoolSubject[]
  assignments: ClassTeacherAssignment[]
  resources: LearningResource[]
  marks: StudentMark[]
  threads: ChatThread[]
  messages: ChatMessage[]
  disciplineCases: DisciplineCase[]
  activityLogs: ActivityLog[]
  timetableEntries: TimetableEntry[]
}

const emptyState: AcademicsState = {
  profiles: [],
  classes: [],
  classStudents: [],
  students: [],
  subjects: [],
  assignments: [],
  resources: [],
  marks: [],
  threads: [],
  messages: [],
  disciplineCases: [],
  activityLogs: [],
  timetableEntries: [],
}

const leadershipRoles = ['SuperAdmin', 'Headmaster', 'DOS', 'HOD'] as const

export default function AcademicsPage() {
  const { accessProfile, user, hasPermission, hasRole } = useAuth()
  const [data, setData] = useState<AcademicsState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [savingResource, setSavingResource] = useState(false)
  const [savingMark, setSavingMark] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [activeThreadId, setActiveThreadId] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        profiles,
        classes,
        classStudents,
        students,
        subjects,
        assignments,
        resources,
        marks,
        threads,
        messages,
        disciplineCases,
        activityLogs,
        timetableEntries,
      ] = await Promise.all([
        getAccessProfiles(),
        getClasses(),
        getClassStudents(),
        getStudents(),
        getSubjects(),
        getClassTeacherAssignments(),
        getLearningResources(),
        getStudentMarks(),
        getChatThreads(),
        getChatMessages(),
        getDisciplineCases(),
        getActivityLogs(),
        getTimetableEntries(),
      ])

      setData({
        profiles,
        classes,
        classStudents,
        students,
        subjects,
        assignments,
        resources,
        marks,
        threads,
        messages,
        disciplineCases,
        activityLogs,
        timetableEntries,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const currentProfileRecord = useMemo(
    () => data.profiles.find((item) => item.email?.toLowerCase() === accessProfile.email?.toLowerCase()),
    [accessProfile.email, data.profiles]
  )

  const isLeadership = hasRole([...leadershipRoles])
  const isTeacher = accessProfile.role === 'Teacher'
  const isParentView = accessProfile.role === 'Parent' || accessProfile.role === 'ParentLeader'
  const actorUid = currentProfileRecord?.id || user?.uid || accessProfile.email || 'system-user'
  const actorName = currentProfileRecord?.fullName || accessProfile.displayName
  const linkedStudentIds = useMemo(
    () => currentProfileRecord?.linkedStudentIds ?? accessProfile.linkedStudentIds ?? [],
    [accessProfile.linkedStudentIds, currentProfileRecord?.linkedStudentIds]
  )

  const teacherAssignments = useMemo(() => {
    if (!isTeacher) return data.assignments
    return data.assignments.filter(
      (item) =>
        item.teacher_user_id === currentProfileRecord?.id ||
        item.teacher_name.toLowerCase() === accessProfile.displayName.toLowerCase()
    )
  }, [accessProfile.displayName, currentProfileRecord?.id, data.assignments, isTeacher])

  const availableClasses = useMemo(() => {
    if (isLeadership) return data.classes

    if (isTeacher) {
      const assignedClassIds = new Set(teacherAssignments.map((item) => item.class_id))
      return data.classes.filter((item) => assignedClassIds.has(item.id))
    }

    if (isParentView) {
      const parentClassIds = new Set(
        data.classStudents
          .filter((item) => linkedStudentIds.includes(item.student_id))
          .map((item) => item.class_id)
      )
      return data.classes.filter((item) => parentClassIds.has(item.id))
    }

    return data.classes
  }, [data.classStudents, data.classes, isLeadership, isParentView, isTeacher, linkedStudentIds, teacherAssignments])

  useEffect(() => {
    if (!selectedClassId && availableClasses[0]?.id) {
      setSelectedClassId(availableClasses[0].id)
    }
  }, [availableClasses, selectedClassId])

  const selectedClass = availableClasses.find((item) => item.id === selectedClassId) || availableClasses[0]
  const selectedClassAssignments = teacherAssignments.filter((item) => item.class_id === selectedClass?.id)
  const leadershipAssignments = data.assignments.filter((item) => item.class_id === selectedClass?.id)
  const effectiveAssignments = isTeacher ? selectedClassAssignments : leadershipAssignments

  const selectedClassStudentIds = data.classStudents
    .filter((item) => item.class_id === selectedClass?.id)
    .map((item) => item.student_id)
  const selectedClassStudents = data.students.filter(
    (item) => selectedClassStudentIds.includes(item.id) && (!isParentView || linkedStudentIds.includes(item.id))
  )
  const selectedSubjects = data.subjects.filter(
    (item) =>
      effectiveAssignments.some((assignment) => assignment.subject_id === item.id) ||
      data.resources.some((resource) => resource.class_id === selectedClass?.id && resource.subject_id === item.id) ||
      data.marks.some((mark) => mark.class_id === selectedClass?.id && mark.subject_id === item.id)
  )

  const visibleResources = useMemo(() => {
    const classFiltered = data.resources.filter((item) => item.class_id === selectedClass?.id)
    if (!isTeacher) return classFiltered
    const allowedSubjectIds = new Set(selectedClassAssignments.map((item) => item.subject_id))
    return classFiltered.filter((item) => !item.subject_id || allowedSubjectIds.has(item.subject_id))
  }, [data.resources, isTeacher, selectedClass?.id, selectedClassAssignments])

  const visibleMarks = useMemo(() => {
    const classFiltered = data.marks.filter((item) => item.class_id === selectedClass?.id)
    if (isParentView) {
      return classFiltered.filter((item) => linkedStudentIds.includes(item.student_id))
    }
    if (!isTeacher) return classFiltered
    const allowedSubjectIds = new Set(selectedClassAssignments.map((item) => item.subject_id))
    return classFiltered.filter((item) => allowedSubjectIds.has(item.subject_id))
  }, [data.marks, isParentView, isTeacher, linkedStudentIds, selectedClass?.id, selectedClassAssignments])

  const visibleThreads = useMemo(() => {
    const classFiltered = data.threads.filter((item) => item.class_id === selectedClass?.id)
    if (isLeadership) return classFiltered
    if (isTeacher) {
      return classFiltered.filter(
        (item) => item.type === 'common' || item.teacher_user_id === currentProfileRecord?.id || !item.teacher_user_id
      )
    }
    return classFiltered.filter((item) => item.type === 'common')
  }, [currentProfileRecord?.id, data.threads, isLeadership, isTeacher, selectedClass?.id])

  useEffect(() => {
    if (!visibleThreads.length) {
      setActiveThreadId('')
      return
    }
    if (!visibleThreads.some((item) => item.id === activeThreadId)) {
      setActiveThreadId(visibleThreads[0].id)
    }
  }, [activeThreadId, visibleThreads])

  const visibleDisciplineCases = data.disciplineCases.filter(
    (item) => item.class_id === selectedClass?.id && (!isParentView || linkedStudentIds.includes(item.student_id))
  )
  const classTimetable = data.timetableEntries.filter((item) => item.class_id === selectedClass?.id)
  const teacherTimetable = isTeacher
    ? data.timetableEntries.filter((item) => item.teacher_user_id === currentProfileRecord?.id)
    : []
  const recentActivity = data.activityLogs
    .filter((item) =>
      selectedClass
        ? (item.target_type === 'student_marks' && visibleMarks.some((mark) => mark.id === item.target_id)) ||
          (item.target_type === 'learning_resources' && visibleResources.some((resource) => resource.id === item.target_id))
        : true
    )
    .slice(0, 8)

  const teacherPermissionFlags = selectedClassAssignments[0]

  const handleCreateResource = async (resource: Omit<LearningResource, 'id' | 'created_at' | 'updated_at'>) => {
    setSavingResource(true)
    try {
      const created = await createLearningResource(resource)
      await logActivity({
        action: 'resource_publish',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'learning_resources',
        target_id: created.id,
        summary: `Published ${created.type.replace('_', ' ')} for ${selectedClass?.name || 'a class'}.`,
      })
      await loadData()
    } finally {
      setSavingResource(false)
    }
  }

  const handleSaveMark = async (mark: Omit<StudentMark, 'id' | 'created_at' | 'updated_at'>) => {
    setSavingMark(true)
    try {
      const existing = data.marks.find(
        (item) =>
          item.class_id === mark.class_id &&
          item.student_id === mark.student_id &&
          item.subject_id === mark.subject_id &&
          item.term === mark.term &&
          item.academic_year === mark.academic_year
      )

      const saved = existing ? await updateStudentMark(existing.id, mark) : await createStudentMark(mark)

      await logActivity({
        action: existing ? 'marks_update' : 'marks_upload',
        actor_uid: actorUid,
        actor_name: actorName,
        actor_role: accessProfile.role,
        target_type: 'student_marks',
        target_id: saved.id,
        summary: `${existing ? 'Updated' : 'Uploaded'} ${saved.subject_name} marks for ${saved.student_name}.`,
      })
      await loadData()
    } finally {
      setSavingMark(false)
    }
  }

  const handleSendMessage = async (threadId: string, message: string) => {
    await createChatMessage({
      thread_id: threadId,
      sender_uid: actorUid,
      sender_name: actorName,
      sender_role: accessProfile.role,
      message,
      is_ghost: accessProfile.role === 'SuperAdmin' && visibleThreads.find((item) => item.id === threadId)?.type === 'private_subject',
    })
    await logActivity({
      action: 'chat_message',
      actor_uid: actorUid,
      actor_name: actorName,
      actor_role: accessProfile.role,
      target_type: 'chat_threads',
      target_id: threadId,
      summary: `Sent a message in ${selectedClass?.name || 'class'} chat.`,
    })
    await loadData()
  }

  if (loading) {
    return (
      <Card title="Academics Management" description="Loading live classes, assignments, resources, marks, and chats.">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">Loading academic workspace...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Academics Management" description="Dynamic class operations for leadership, teachers, and learner access.">
        <div className="space-y-5">
          <ClassSummaryCards
            classes={availableClasses}
            assignments={isTeacher ? teacherAssignments : data.assignments}
            resources={visibleResources}
            marks={visibleMarks}
            disciplineCases={visibleDisciplineCases}
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Class Access Scope</h3>
                <p className="text-sm text-slate-400">
                  {isLeadership
                    ? 'You can move across multiple classes, subjects, and teachers.'
                    : isTeacher
                      ? 'You are seeing only the classes and subjects assigned to you.'
                      : isParentView
                        ? 'You can review only your assigned students and their class-level academic context.'
                        : 'This view follows your current class-based access.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableClasses.map((item) => (
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
            </div>

            {selectedClass ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr,1fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold text-white">{selectedClass.name}</h4>
                    <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{selectedClass.department}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    {selectedClassStudents.length} students · {effectiveAssignments.length} active subject assignments
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {effectiveAssignments.map((assignment) => (
                      <Badge key={assignment.id} className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">
                        {assignment.subject_name} · {assignment.teacher_name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                  <h4 className="text-lg font-semibold text-white">Teacher Permission Layer</h4>
                  {teacherPermissionFlags ? (
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <p>Invite students: {teacherPermissionFlags.can_invite_students ? 'Enabled by DOS' : 'Not enabled'}</p>
                      <p>Invite parents: {teacherPermissionFlags.can_invite_parents ? 'Enabled by DOD' : 'Not enabled'}</p>
                      <p>Class change action: {teacherPermissionFlags.can_change_class ? 'Explicitly allowed' : 'Needs approval'}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">No teacher-specific override is active for this class selection.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                No classes are available for your current access profile yet.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="chat">Chats</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card title="Class Resources" description="Assignments, exercises, materials, and holiday packages flow from live class data.">
            <LearningResourcesPanel
              resources={visibleResources}
              classes={availableClasses}
              subjects={selectedSubjects.length > 0 ? selectedSubjects : data.subjects}
              selectedClassId={selectedClass?.id}
              teacherName={actorName}
              teacherUid={actorUid}
              canManage={isLeadership || isTeacher}
              saving={savingResource}
              onCreate={handleCreateResource}
            />
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card
            title="Class Timetable"
            description="Published class periods stay visible to leadership, teachers, students, and parents inside the academic workspace."
          >
            <div className="space-y-6">
              <TimetablePanel
                entries={classTimetable}
                title={selectedClass ? `${selectedClass.name} Weekly Timetable` : 'Class Timetable'}
                description={
                  isTeacher
                    ? 'This class timetable is filtered from the live DOS schedule and helps you follow the periods assigned to this class.'
                    : 'This view shows the latest timetable published for the selected class, including subjects and teachers by day.'
                }
                emptyMessage="No timetable has been published for this class yet."
              />

              {isTeacher ? (
                <TimetablePanel
                  entries={teacherTimetable}
                  title="Your Teaching Timetable"
                  description="All of your scheduled periods across classes appear here so you can monitor your full teaching week in one place."
                  emptyMessage="No timetable entries are currently assigned to your teaching profile."
                />
              ) : null}

              {!isTeacher ? (
                <TimetablePanel
                  entries={classTimetable}
                  title="Teachers In This Class"
                  description="Parents, students, and leadership can also review which teacher handles each subject for the selected class."
                  emptyMessage="Teacher timetable details will appear here after the class timetable is published."
                  groupBy="teacher"
                />
              ) : null}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <Card title="Marks and Subject Reports" description="Teachers can enter subject marks. Leadership can track class outcomes and student performance.">
            <MarksCenter
              marks={visibleMarks}
              comments={[]}
              students={selectedClassStudents}
              classes={availableClasses}
              subjects={(selectedSubjects.length > 0 ? selectedSubjects : data.subjects).map((item) => ({ id: item.id, name: item.name }))}
              selectedClassId={selectedClass?.id}
              teacherName={actorName}
              teacherUid={actorUid}
              canManage={hasPermission('upload_marks')}
              saving={savingMark}
              onSubmitMark={handleSaveMark}
            />
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card title="Class Chat System" description="Common class chats and private subject threads support class discussion and academic follow-up.">
            <ClassChatPanel
              threads={visibleThreads}
              messages={data.messages}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              onSendMessage={handleSendMessage}
            />
          </Card>
        </TabsContent>

        <TabsContent value="discipline">
          <Card title="Student Wellbeing and Discipline" description="Academic staff can see discipline context while students remain read-only in their own dashboard.">
            <DisciplinePreview cases={visibleDisciplineCases} emptyMessage="No discipline or wellbeing notes are currently attached to this class." />
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card title="Academic Activity Log" description="Marks uploads, resource publishing, and classroom updates are tracked for accountability.">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                  No recent academic activity was found for this class yet.
                </div>
              ) : null}
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{item.actor_name}</p>
                      {item.actor_role ? <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{item.actor_role}</Badge> : null}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{item.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

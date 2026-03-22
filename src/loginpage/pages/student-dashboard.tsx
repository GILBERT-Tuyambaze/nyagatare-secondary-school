import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import {
  addMarkComment,
  createChatMessage,
  getAccessProfiles,
  getChatMessages,
  getChatThreads,
  getClasses,
  getClassStudents,
  getDisciplineCases,
  getLearningResources,
  getMarkComments,
  getOrCreatePrivateSubjectThread,
  getStudentMarks,
  getStudents,
  getTimetableEntries,
  logActivity,
} from '@/services/firestoreService'
import { ChatMessage, ChatThread, DisciplineCase, LearningResource, MarkComment, Student, StudentMark, TimetableEntry } from '@/types/database'
import { Card } from '../components/Card'
import { ClassChatPanel } from '../components/ClassChatPanel'
import { DisciplinePreview } from '../components/DisciplinePreview'
import { LearningResourcesPanel } from '../components/LearningResourcesPanel'
import { MarksCenter } from '../components/MarksCenter'
import { TimetablePanel } from '../components/TimetablePanel'
import { Classroom } from '../types'

type StudentDashboardData = {
  classes: Classroom[]
  classStudents: Array<{ id: string; class_id: string; student_id: string }>
  students: Student[]
  resources: LearningResource[]
  marks: StudentMark[]
  comments: MarkComment[]
  threads: ChatThread[]
  messages: ChatMessage[]
  disciplineCases: DisciplineCase[]
  accessProfiles: Array<{ id: string; email?: string; displayName?: string }>
  timetableEntries: TimetableEntry[]
}

const emptyState: StudentDashboardData = {
  classes: [],
  classStudents: [],
  students: [],
  resources: [],
  marks: [],
  comments: [],
  threads: [],
  messages: [],
  disciplineCases: [],
  accessProfiles: [],
  timetableEntries: [],
}

export default function StudentDashboardPage() {
  const { accessProfile, user } = useAuth()
  const [data, setData] = useState<StudentDashboardData>(emptyState)
  const [loading, setLoading] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [classes, classStudents, students, resources, marks, comments, threads, messages, disciplineCases, accessProfiles, timetableEntries] =
        await Promise.all([
          getClasses(),
          getClassStudents(),
          getStudents(),
          getLearningResources(),
          getStudentMarks(),
          getMarkComments(),
          getChatThreads(),
          getChatMessages(),
          getDisciplineCases(),
          getAccessProfiles(),
          getTimetableEntries(),
        ])

      setData({
        classes,
        classStudents,
        students,
        resources,
        marks,
        comments,
        threads,
        messages,
        disciplineCases,
        accessProfiles,
        timetableEntries,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const currentStudent = useMemo(() => {
    const byEmail = data.students.find((item) => item.email?.toLowerCase() === accessProfile.email?.toLowerCase())
    if (byEmail) return byEmail

    const normalizedName = accessProfile.displayName.toLowerCase().trim()
    return data.students.find((item) => `${item.first_name} ${item.last_name}`.toLowerCase() === normalizedName)
  }, [accessProfile.displayName, accessProfile.email, data.students])

  const membership = data.classStudents.find((item) => item.student_id === currentStudent?.id)
  const studentClass = data.classes.find((item) => item.id === membership?.class_id)
  const classResources = data.resources.filter((item) => item.class_id === studentClass?.id)
  const studentMarks = data.marks.filter((item) => item.student_id === currentStudent?.id)
  const studentDiscipline = data.disciplineCases.filter((item) => item.student_id === currentStudent?.id)
  const chatThreads = data.threads.filter(
    (item) =>
      item.class_id === studentClass?.id &&
      (item.type === 'common' || item.student_id === currentStudent?.id)
  )
  const classTimetable = data.timetableEntries.filter((item) => item.class_id === studentClass?.id)
  const averageMark = studentMarks.length
    ? Math.round(studentMarks.reduce((sum, item) => sum + (item.score / Math.max(item.max_score, 1)) * 100, 0) / studentMarks.length)
    : 0
  const pendingResources = classResources.filter((item) => item.due_date).length

  useEffect(() => {
    if (!chatThreads.length) {
      setActiveThreadId('')
      return
    }
    if (!chatThreads.some((item) => item.id === activeThreadId)) {
      setActiveThreadId(chatThreads[0].id)
    }
  }, [activeThreadId, chatThreads])

  const handleAddComment = async (markId: string, message: string) => {
    if (!currentStudent) return
    await addMarkComment({
      mark_id: markId,
      student_id: currentStudent.id,
      student_name: `${currentStudent.first_name} ${currentStudent.last_name}`,
      message,
    })
    await logActivity({
      action: 'student_mark_comment',
      actor_uid: user?.uid || accessProfile.email || currentStudent.id,
      actor_name: accessProfile.displayName,
      actor_role: accessProfile.role,
      target_type: 'student_marks',
      target_id: markId,
      summary: `${accessProfile.displayName} responded to a subject mark.`,
    })
    await loadData()
  }

  const handleOpenSubjectThread = async (subjectId: string) => {
    if (!currentStudent || !studentClass) return
    const mark = studentMarks.find((item) => item.subject_id === subjectId)
    if (!mark) return

    const thread = await getOrCreatePrivateSubjectThread({
      classId: studentClass.id,
      subjectId: mark.subject_id,
      subjectName: mark.subject_name,
      studentId: currentStudent.id,
      studentName: `${currentStudent.first_name} ${currentStudent.last_name}`,
      teacherUserId: mark.teacher_user_id,
      teacherName: mark.teacher_name,
    })
    setActiveThreadId(thread.id)
    await loadData()
  }

  const handleSendMessage = async (threadId: string, message: string) => {
    await createChatMessage({
      thread_id: threadId,
      sender_uid: user?.uid || currentStudent?.id || accessProfile.email || 'student',
      sender_name: accessProfile.displayName,
      sender_role: accessProfile.role,
      message,
    })
    await logActivity({
      action: 'student_message',
      actor_uid: user?.uid || currentStudent?.id || accessProfile.email || 'student',
      actor_name: accessProfile.displayName,
      actor_role: accessProfile.role,
      target_type: 'chat_threads',
      target_id: threadId,
      summary: `${accessProfile.displayName} sent a class or subject message.`,
    })
    await loadData()
  }

  if (loading) {
    return (
      <Card title="Student Dashboard" description="Loading your class space, marks, and learning support tools.">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">Loading learner workspace...</div>
      </Card>
    )
  }

  if (!currentStudent || !studentClass) {
    return (
      <Card title="Student Dashboard" description="A focused learner workspace for class access, marks, and academic follow-up.">
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-300">
          We could not match this signed-in account to a student and class record yet. Add the student email to the student database or assign the learner to a class first.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Student Dashboard" description={`Live learner view for ${currentStudent.first_name} ${currentStudent.last_name}.`}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Current Class</p>
              <p className="mt-2 text-2xl font-bold text-white">{studentClass.name}</p>
              <p className="mt-2 text-sm text-slate-300">{studentClass.department}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Average Mark</p>
              <p className="mt-2 text-2xl font-bold text-cyan-200">{averageMark}%</p>
              <p className="mt-2 text-sm text-slate-300">{studentMarks.length} subject marks available</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Learning Queue</p>
              <p className="mt-2 text-2xl font-bold text-white">{pendingResources}</p>
              <p className="mt-2 text-sm text-slate-300">Assignments and packages with due dates</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Learner Access</h3>
                <p className="mt-2 text-sm text-slate-400">
                  View class resources, react to marks, message subject teachers, and read discipline notes without editing them.
                </p>
              </div>
              <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">{accessProfile.role}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
          <TabsTrigger value="resources">Class Access</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="chat">Teacher Messaging</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card title="Class Resources" description="Assignments, exercises, notes, holiday packages, and teacher materials for your class.">
            <LearningResourcesPanel
              resources={classResources}
              classes={[studentClass]}
              subjects={[]}
              selectedClassId={studentClass.id}
              teacherName={accessProfile.displayName}
              teacherUid={user?.uid || currentStudent.id}
              canManage={false}
            />
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card title="Class Timetable" description="See the timetable for your class and the teachers handling each period.">
            <TimetablePanel
              entries={classTimetable}
              title={`${studentClass.name} Timetable`}
              description="This timetable is generated by school leadership and reflects the latest saved class schedule."
              emptyMessage="No timetable has been published for this class yet."
            />
          </Card>
        </TabsContent>

        <TabsContent value="marks">
          <Card title="Marks and Teacher Comments" description="Review your subject marks, see teacher comments, and respond directly from each mark card.">
            <MarksCenter
              marks={studentMarks}
              comments={data.comments}
              students={[currentStudent]}
              classes={[studentClass]}
              subjects={studentMarks.map((item) => ({ id: item.subject_id, name: item.subject_name }))}
              selectedClassId={studentClass.id}
              teacherName={accessProfile.displayName}
              teacherUid={user?.uid || currentStudent.id}
              canManage={false}
              allowCommenting
              onAddComment={handleAddComment}
              onOpenThread={(subjectId) => {
                void handleOpenSubjectThread(subjectId)
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card title="Class and Subject Messaging" description="Join the common class chat or open a private subject thread with the teacher responsible for a mark.">
            <ClassChatPanel
              threads={chatThreads}
              messages={data.messages}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              onSendMessage={handleSendMessage}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              {studentMarks.map((mark) => (
                <Button
                  key={mark.id}
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"
                  onClick={() => {
                    void handleOpenSubjectThread(mark.subject_id)
                  }}
                >
                  Message {mark.teacher_name} about {mark.subject_name}
                </Button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="discipline">
          <Card title="Discipline and Wellbeing" description="Read staff comments, warnings, and resolved notes related to your discipline record.">
            <DisciplinePreview
              cases={studentDiscipline}
              emptyMessage="No discipline or wellbeing notes have been recorded for this student."
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

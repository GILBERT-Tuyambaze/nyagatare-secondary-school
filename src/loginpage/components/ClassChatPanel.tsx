import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatMessage, ChatThread } from '@/types/database'

export function ClassChatPanel({
  threads,
  messages,
  activeThreadId,
  onSelectThread,
  onSendMessage,
}: {
  threads: ChatThread[]
  messages: ChatMessage[]
  activeThreadId?: string
  onSelectThread: (threadId: string) => void
  onSendMessage: (threadId: string, message: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')

  const activeThread = useMemo(
    () => threads.find((item) => item.id === activeThreadId) || threads[0],
    [activeThreadId, threads]
  )
  const threadMessages = useMemo(
    () => messages.filter((item) => item.thread_id === activeThread?.id),
    [messages, activeThread]
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[320px,1fr]">
      <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Class Conversations</h3>
          <p className="text-sm text-slate-400">Common chats, private subject threads, and leadership visibility.</p>
        </div>
        {threads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">
            No chat threads are available yet.
          </div>
        ) : null}
        {threads.map((thread) => {
          const isActive = activeThread?.id === thread.id
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                isActive
                  ? 'border-cyan-400/40 bg-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white">{thread.title}</p>
                <Badge className={thread.type === 'common' ? 'bg-cyan-500/15 text-cyan-200' : 'bg-violet-500/15 text-violet-200'}>
                  {thread.type === 'common' ? 'Common' : 'Private'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">{thread.subject_name || 'General class discussion'}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        {activeThread ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{activeThread.title}</h3>
                <p className="text-sm text-slate-400">
                  {activeThread.type === 'private_subject'
                    ? 'Private thread between the student and the subject teacher. Ghost admins can monitor without appearing.'
                    : 'Shared class conversation for students, teachers, and school leadership.'}
                </p>
              </div>
              <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{activeThread.subject_name || 'School class chat'}</Badge>
            </div>
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {threadMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{message.sender_name}</p>
                      <Badge className="bg-slate-800 text-slate-200 hover:bg-slate-800">{message.sender_role}</Badge>
                      {message.is_ghost ? <Badge className="bg-amber-500/15 text-amber-200 hover:bg-amber-500/15">Ghost Mode</Badge> : null}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{message.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a class update, academic reply, or support message."
                className="min-h-[48px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
              />
              <Button
                type="button"
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                onClick={async () => {
                  const message = draft.trim()
                  if (!activeThread?.id || !message) return
                  await onSendMessage(activeThread.id, message)
                  setDraft('')
                }}
              >
                Send Message
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
            Choose a class chat to start reading and sending messages.
          </div>
        )}
      </div>
    </div>
  )
}

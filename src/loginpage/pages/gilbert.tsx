import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Eye, EyeOff, Mail, MessageSquare, UserRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPublicAiAssistantSettings,
  getPublicAiConversationSummaries,
  updatePublicAiAssistantSettings,
} from '@/services/firestoreService'
import { PublicAiAssistantSettings, PublicAiConversationSummary } from '@/types/database'
import { Card } from '../components/Card'

type PublicAiConversationUserGroup = {
  key: string
  visitor_name: string
  visitor_email: string
  visitor_role?: string
  total_sessions: number
  total_messages: number
  updated_at: string
  items: PublicAiConversationSummary[]
}

const fieldClassName =
  'min-h-[120px] border-slate-700 bg-slate-950 text-white placeholder:text-slate-400'

export default function GilbertPage() {
  const { accessProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingMessage, setSavingMessage] = useState('')
  const [settings, setSettings] = useState<PublicAiAssistantSettings>({
    id: 'public_ai_assistant',
    enabled: true,
    hidden_message: '',
    updated_at: '',
  })
  const [hiddenMessageDraft, setHiddenMessageDraft] = useState('')
  const [summaries, setSummaries] = useState<PublicAiConversationSummary[]>([])
  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null)

  const canManageVisibility = ['SuperAdmin', 'Headmaster', 'HOD'].includes(accessProfile.role)

  const loadData = async () => {
    setLoading(true)
    try {
      const [settingsData, summaryData] = await Promise.all([
        getPublicAiAssistantSettings(),
        getPublicAiConversationSummaries(),
      ])
      setSettings(settingsData)
      setHiddenMessageDraft(settingsData.hidden_message || '')
      setSummaries(summaryData)
    } catch (error) {
      console.error('Failed to load GILBERT workspace data:', error)
      setSavingMessage('Could not load GILBERT data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const userGroups = useMemo(() => {
    const visibleSummaries = summaries.filter(
      (conversation) => !conversation.visitor_is_ghost && conversation.visitor_role !== 'SuperAdmin'
    )
    const groups = new Map<string, PublicAiConversationUserGroup>()

    visibleSummaries.forEach((conversation) => {
      const key = conversation.visitor_email.toLowerCase()
      const existing = groups.get(key)

      if (existing) {
        existing.total_sessions += 1
        existing.total_messages += conversation.message_count
        if (new Date(conversation.updated_at) > new Date(existing.updated_at)) {
          existing.updated_at = conversation.updated_at
        }
        existing.items.push(conversation)
        return
      }

      groups.set(key, {
        key,
        visitor_name: conversation.visitor_name,
        visitor_email: conversation.visitor_email,
        visitor_role: conversation.visitor_role,
        total_sessions: 1,
        total_messages: conversation.message_count,
        updated_at: conversation.updated_at,
        items: [conversation],
      })
    })

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        ),
      }))
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
  }, [summaries])

  const selectedUser = userGroups.find((group) => group.key === selectedUserKey) ?? userGroups[0] ?? null

  useEffect(() => {
    if (!userGroups.length) {
      setSelectedUserKey(null)
      return
    }

    if (!selectedUserKey || !userGroups.some((group) => group.key === selectedUserKey)) {
      setSelectedUserKey(userGroups[0].key)
    }
  }, [selectedUserKey, userGroups])

  const handleToggle = async (enabled: boolean) => {
    if (!canManageVisibility) return
    setSavingMessage('')
    try {
      const updated = await updatePublicAiAssistantSettings({
        enabled,
        hidden_message: hiddenMessageDraft,
        updated_by: accessProfile.fullName || accessProfile.displayName,
        updated_by_role: accessProfile.role,
      })
      setSettings(updated)
      setSavingMessage(`GILBERT is now ${enabled ? 'visible' : 'hidden'} on the public website.`)
    } catch (error) {
      console.error('Failed to update GILBERT visibility:', error)
      setSavingMessage('Could not update GILBERT visibility right now.')
    }
  }

  const handleSaveHiddenMessage = async () => {
    if (!canManageVisibility) return
    setSavingMessage('')
    try {
      const updated = await updatePublicAiAssistantSettings({
        enabled: settings.enabled,
        hidden_message: hiddenMessageDraft,
        updated_by: accessProfile.fullName || accessProfile.displayName,
        updated_by_role: accessProfile.role,
      })
      setSettings(updated)
      setSavingMessage('GILBERT hidden notice updated.')
    } catch (error) {
      console.error('Failed to save GILBERT hidden notice:', error)
      setSavingMessage('Could not update the hidden notice right now.')
    }
  }

  if (loading) {
    return (
      <Card
        title="GILBERT"
        description="The public website assistant for visitors, separate from the internal AI Hub."
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
          Loading GILBERT workspace...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card
        title="GILBERT"
        description="The public website assistant for visitors. This page is separate from the internal AI Hub and focuses on public assistant visibility and conversations."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Visibility',
              value: settings.enabled ? 'Visible' : 'Hidden',
              note: 'Current public website status',
              icon: settings.enabled ? Eye : EyeOff,
            },
            {
              label: 'Visitors',
              value: userGroups.length,
              note: 'Unique public users with saved summaries',
              icon: UserRound,
            },
            {
              label: 'Sessions',
              value: summaries.filter((conversation) => !conversation.visitor_is_ghost).length,
              note: 'Tracked conversation summaries',
              icon: MessageSquare,
            },
            {
              label: 'Last Update',
              value: settings.updated_at ? new Date(settings.updated_at).toLocaleDateString() : 'Not yet',
              note: settings.updated_by ? `Updated by ${settings.updated_by}` : 'No update history yet',
              icon: Bot,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.note}</p>
                  </div>
                  <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {savingMessage ? <p className="text-sm text-cyan-200">{savingMessage}</p> : null}

      <Card
        title="Public Assistant Visibility"
        description="Control whether GILBERT appears on the public website and define the notice shown when it is hidden."
      >
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Current Status</p>
                <p className="mt-1 text-sm text-slate-400">
                  {settings.enabled
                    ? 'GILBERT is available to public visitors.'
                    : 'GILBERT is currently hidden from the public website.'}
                </p>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                {settings.enabled ? 'Visible' : 'Hidden'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={() => void handleToggle(true)}
                disabled={!canManageVisibility || settings.enabled}
              >
                Show GILBERT
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                onClick={() => void handleToggle(false)}
                disabled={!canManageVisibility || !settings.enabled}
              >
                Hide GILBERT
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <p className="font-semibold text-white">Hidden Notice</p>
              <p className="mt-1 text-sm text-slate-400">
                This message appears if GILBERT is disabled on the public website.
              </p>
            </div>
            <Textarea
              value={hiddenMessageDraft}
              onChange={(event) => setHiddenMessageDraft(event.target.value)}
              className={fieldClassName}
              placeholder="GILBERT is temporarily unavailable. Please use the contact page or call the school office."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={() => void handleSaveHiddenMessage()}
                disabled={!canManageVisibility}
              >
                Save Notice
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                onClick={() => setHiddenMessageDraft(settings.hidden_message || '')}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Conversation Summaries"
        description="Review GILBERT usage grouped by visitor. Ghost-admin and superadmin assistant records stay excluded here."
      >
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">Visitors</p>
              <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                {userGroups.length}
              </Badge>
            </div>
            {userGroups.length ? (
              <div className="space-y-2">
                {userGroups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setSelectedUserKey(group.key)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selectedUser?.key === group.key
                        ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-50'
                        : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{group.visitor_name}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{group.visitor_email}</p>
                      </div>
                      <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                        {group.total_sessions}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
                No public GILBERT conversations have been saved yet.
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            {selectedUser ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedUser.visitor_name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="h-4 w-4" />
                      {selectedUser.visitor_email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                      {selectedUser.total_sessions} sessions
                    </Badge>
                    <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                      {selectedUser.total_messages} messages
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedUser.items.map((conversation) => (
                    <div key={conversation.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{conversation.source_page}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Updated {new Date(conversation.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                            {conversation.status}
                          </Badge>
                          <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                            {conversation.message_count} msgs
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{conversation.summary}</p>
                      {conversation.last_user_message ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Last visitor message: {conversation.last_user_message}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                Select a visitor to review that person&apos;s GILBERT conversation summaries.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

import { FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bot, ChevronUp, GripHorizontal, MessageSquare, Minimize2, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import {
  getBoardMembers,
  getContentPosts,
  getEvents,
  subscribePublicAiAssistantSettings,
  upsertPublicAiConversationSummary,
} from '@/services/firestoreService'
import { PublicAiAssistantSettings } from '@/types/database'

type AssistantMessage = {
  id: string
  speaker: 'assistant' | 'user'
  message: string
}

type WidgetPosition = {
  x: number
  y: number
}

type DockSide = 'left' | 'right'

type PublicAiResponse = {
  id?: string | null
  reply?: string
  summary?: string
  error?: string
}

const STORAGE_KEYS = {
  position: 'nss-public-ai-position',
  visitor: 'nss-public-ai-visitor',
  dockSide: 'nss-public-ai-dock-side',
} as const

const PUBLIC_PATHS = new Set(['/', '/enroll', '/enrollment', '/events', '/blog', '/board-members'])

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const MINIMIZED_SIZE = 56
const EXPANDED_WIDTH = 360
const EXPANDED_HEIGHT = 520
const QUICK_PROMPTS = [
  'How do I apply?',
  'What events are coming?',
  'Who developed this website?',
] as const

const dockToNearestEdge = (position: WidgetPosition, width: number, height: number): WidgetPosition => {
  if (typeof window === 'undefined') return position

  const edgeInset = 12
  const left = edgeInset
  const right = Math.max(edgeInset, window.innerWidth - width - edgeInset)
  const y = clamp(position.y, 72, Math.max(72, window.innerHeight - height - edgeInset))

  return {
    x: position.x + width / 2 < window.innerWidth / 2 ? left : right,
    y,
  }
}

const fitExpandedWidget = (position: WidgetPosition): WidgetPosition => {
  if (typeof window === 'undefined') return position

  return {
    x: clamp(position.x, 12, Math.max(12, window.innerWidth - EXPANDED_WIDTH - 12)),
    y: clamp(position.y, 72, Math.max(72, window.innerHeight - EXPANDED_HEIGHT - 12)),
  }
}

const createSessionId = () =>
  globalThis.crypto?.randomUUID?.() ?? `gilbert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const getDefaultPosition = (): WidgetPosition => {
  if (typeof window === 'undefined') {
    return { x: 24, y: 120 }
  }

  return {
    x: Math.max(16, window.innerWidth - 388),
    y: Math.max(96, window.innerHeight - 560),
  }
}

const normalizePath = (pathname: string) => (pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname)

export default function PublicAiAssistant() {
  const { accessProfile, user } = useAuth()
  const location = useLocation()
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const minimizedRef = useRef(true)
  const closedRef = useRef(false)
  const dragMovedRef = useRef(false)
  const [settings, setSettings] = useState<PublicAiAssistantSettings>({
    id: 'public_ai_assistant',
    enabled: true,
    hidden_message: '',
    updated_at: new Date().toISOString(),
  })
  const [position, setPosition] = useState<WidgetPosition>(() => {
    if (typeof window === 'undefined') return getDefaultPosition()
    const raw = window.localStorage.getItem(STORAGE_KEYS.position)
    if (!raw) return getDefaultPosition()

    try {
      const parsed = JSON.parse(raw) as WidgetPosition
      return {
        x: Number.isFinite(parsed.x) ? parsed.x : getDefaultPosition().x,
        y: Number.isFinite(parsed.y) ? parsed.y : getDefaultPosition().y,
      }
    } catch {
      return getDefaultPosition()
    }
  })
  const [dockSide, setDockSide] = useState<DockSide>(() => {
    if (typeof window === 'undefined') return 'right'
    const saved = window.localStorage.getItem(STORAGE_KEYS.dockSide)
    return saved === 'left' || saved === 'right' ? saved : 'right'
  })
  const [closed, setClosed] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const [working, setWorking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [draft, setDraft] = useState('')
  const [summary, setSummary] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [openingAnimation, setOpeningAnimation] = useState<DockSide | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      speaker: 'assistant',
      message:
        'I am GILBERT. I can help with admissions guidance, events, blog and news updates, governance information, and contact directions for Nyagatare Secondary School.',
    },
  ])
  const [visitor, setVisitor] = useState(() => {
    if (typeof window === 'undefined') {
      return { name: '', email: '' }
    }

    const raw = window.localStorage.getItem(STORAGE_KEYS.visitor)
    if (!raw) {
      return { name: '', email: '' }
    }

    try {
      const parsed = JSON.parse(raw) as { name?: string; email?: string }
      return {
        name: parsed.name?.trim() || '',
        email: parsed.email?.trim() || '',
      }
    } catch {
      return { name: '', email: '' }
    }
  })
  const [identityDraft, setIdentityDraft] = useState(() => ({ name: '', email: '' }))
  const [sessionId] = useState(() => createSessionId())
  const [startedAt] = useState(() => new Date().toISOString())
  const [publicContext, setPublicContext] = useState({
    school: {
      name: 'Nyagatare Secondary School',
      nickname: 'NSS',
      location: 'Nyagatare District, Eastern Province, Rwanda',
      strengths: ['STEM education', 'academic excellence', 'student discipline', 'digital school services'],
      publicRoutes: ['Home', 'Admissions', 'Events', 'Blog and News', 'Board Members', 'Contact'],
    },
    developer: {
      name: 'Gilbert TUYAMBAZE',
      portfolio_url: 'https://tuyambaze-gilbert.vercel.app/',
      footer_credit: 'Developed By Gilbert TUYAMBAZE',
    },
    events: [] as Array<Record<string, unknown>>,
    content: [] as Array<Record<string, unknown>>,
    boardMembers: [] as Array<Record<string, unknown>>,
  })

  const isVisibleRoute = useMemo(() => PUBLIC_PATHS.has(normalizePath(location.pathname)), [location.pathname])
  useEffect(() => {
    minimizedRef.current = minimized
  }, [minimized])

  useEffect(() => {
    closedRef.current = closed
  }, [closed])

  useEffect(() => {
    const unsubscribe = subscribePublicAiAssistantSettings((next) => setSettings(next))
    return unsubscribe
  }, [])

  useEffect(() => {
    let active = true

    const loadContext = async () => {
      try {
        const [events, contentPosts, boardMembers] = await Promise.all([
          getEvents(),
          getContentPosts(),
          getBoardMembers(),
        ])

        if (!active) return

        setPublicContext({
          school: {
            name: 'Nyagatare Secondary School',
            nickname: 'NSS',
            location: 'Nyagatare District, Eastern Province, Rwanda',
            strengths: ['STEM education', 'academic excellence', 'student discipline', 'digital school services'],
            publicRoutes: ['Home', 'Admissions', 'Events', 'Blog and News', 'Board Members', 'Contact'],
          },
          developer: {
            name: 'Gilbert TUYAMBAZE',
            portfolio_url: 'https://tuyambaze-gilbert.vercel.app/',
            footer_credit: 'Developed By Gilbert TUYAMBAZE',
          },
          events: events.slice(0, 12).map((event) => ({
            title: event.title,
            category: event.category,
            date: event.event_date,
            status: event.status,
            location: event.location || '',
          })),
          content: contentPosts
            .filter((post) => post.status === 'published')
            .slice(0, 18)
            .map((post) => ({
              title: post.title,
              type: post.type,
              excerpt: post.excerpt || '',
              slug: post.slug,
            })),
          boardMembers: boardMembers.slice(0, 12).map((member) => ({
            full_name: member.full_name,
            position: member.position,
            category: member.category,
          })),
        })
      } catch (error) {
        console.error('Failed to load public AI assistant context:', error)
      }
    }

    void loadContext()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!user?.email) return

    setVisitor({
      name: accessProfile.displayName || user.displayName || '',
      email: user.email,
    })
  }, [accessProfile.displayName, user])

  useEffect(() => {
    if (!visitor.name || !visitor.email || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEYS.visitor, JSON.stringify(visitor))
  }, [visitor])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(position))
  }, [position])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEYS.dockSide, dockSide)
  }, [dockSide])

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        const width = minimized ? MINIMIZED_SIZE : EXPANDED_WIDTH
        const height = minimized ? MINIMIZED_SIZE : EXPANDED_HEIGHT
        const maxX = Math.max(16, window.innerWidth - width)
        const maxY = Math.max(72, window.innerHeight - height)
        return {
          x: clamp(current.x, 16, maxX),
          y: clamp(current.y, 72, maxY),
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [minimized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, minimized, closed])

  useEffect(() => {
    if (!minimized) return
    setPosition((current) => {
      const next = dockToNearestEdge(current, MINIMIZED_SIZE, MINIMIZED_SIZE)
      setDockSide(next.x <= 20 ? 'left' : 'right')
      return next
    })
  }, [minimized])

  useEffect(() => {
    if (!openingAnimation) return
    const timeout = window.setTimeout(() => setOpeningAnimation(null), 220)
    return () => window.clearTimeout(timeout)
  }, [openingAnimation])

  const activeVisitor = useMemo(() => {
    if (visitor.name.trim() && visitor.email.trim()) {
      return {
        name: visitor.name.trim(),
        email: visitor.email.trim().toLowerCase(),
      }
    }

    return null
  }, [visitor])

  const saveConversationSummary = async ({
    nextMessages,
    nextSummary,
    lastUserMessage,
    lastAssistantMessage,
    status = 'active',
  }: {
    nextMessages: AssistantMessage[]
    nextSummary: string
    lastUserMessage: string
    lastAssistantMessage?: string
    status?: 'active' | 'closed'
  }) => {
    if (!activeVisitor) return

    const userQuestions = nextMessages
      .filter((item) => item.speaker === 'user')
      .map((item) => item.message.trim())
      .filter(Boolean)

    try {
      await upsertPublicAiConversationSummary(sessionId, {
        visitor_name: activeVisitor.name,
        visitor_email: activeVisitor.email,
        visitor_uid: user?.uid || undefined,
        visitor_role: user ? accessProfile.role : 'Guest',
        visitor_is_ghost: Boolean(user && accessProfile.isGhost),
        source_page: location.pathname,
        message_count: nextMessages.filter((item) => item.speaker === 'user').length,
        user_questions: userQuestions,
        last_user_message: lastUserMessage,
        last_assistant_message: lastAssistantMessage,
        summary: nextSummary,
        status,
        started_at: startedAt,
      })
    } catch (error) {
      console.error('Failed to save public AI conversation summary:', error)
    }
  }

  const handleIdentitySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = identityDraft.name.trim()
    const email = identityDraft.email.trim().toLowerCase()

    if (!name || !email) {
      setErrorMessage('Please provide your name and email before chatting with GILBERT.')
      return
    }

    setVisitor({ name, email })
    setIdentityDraft({ name: '', email: '' })
    setErrorMessage('')
  }

  const handleSend = async () => {
    const message = draft.trim()

    if (!message || working) return

    if (!activeVisitor) {
      setErrorMessage('Please provide your name and email first.')
      return
    }

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      message,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')
    setErrorMessage('')
    setWorking(true)
    void saveConversationSummary({
      nextMessages,
      nextSummary: summary || `Visitor asked: ${message.slice(0, 140)}`,
      lastUserMessage: message,
    })

    try {
      const response = await fetch('/api/public-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages.slice(-8),
          visitor: activeVisitor,
          pagePath: location.pathname,
          publicContext,
        }),
      })

      const rawText = await response.text()
      let data: PublicAiResponse = {}

      try {
        data = rawText ? (JSON.parse(rawText) as PublicAiResponse) : {}
      } catch {
        data = {
          error: response.ok
            ? 'GILBERT returned an unreadable response.'
            : 'GILBERT is temporarily unavailable. Please try again in a moment.',
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Could not get a response from GILBERT right now.')
      }

      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now() + 1}`,
        speaker: 'assistant',
        message: data.reply || 'I could not find a public answer for that right now.',
      }
      const finalMessages = [...nextMessages, assistantMessage]
      const nextSummary = data.summary || summary || `Visitor asked about ${message.slice(0, 120)}`

      setMessages(finalMessages)
      setSummary(nextSummary)
      if (minimizedRef.current || closedRef.current) {
        setUnreadCount((current) => current + 1)
      }
      await saveConversationSummary({
        nextMessages: finalMessages,
        nextSummary,
        lastUserMessage: message,
        lastAssistantMessage: assistantMessage.message,
      })
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Could not get a response from GILBERT right now.'
      setErrorMessage(messageText)
      const assistantMessage: AssistantMessage = {
        id: `assistant-error-${Date.now() + 1}`,
        speaker: 'assistant',
        message:
          'I could not answer right now. Please try again in a moment, or contact the school directly for urgent help.',
      }
      const finalMessages = [...nextMessages, assistantMessage]
      setMessages(finalMessages)
      if (minimizedRef.current || closedRef.current) {
        setUnreadCount((current) => current + 1)
      }
      await saveConversationSummary({
        nextMessages: finalMessages,
        nextSummary: summary || `Visitor asked: ${message.slice(0, 140)}`,
        lastUserMessage: message,
        lastAssistantMessage: assistantMessage.message,
      })
    } finally {
      setWorking(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setDraft(prompt)
    setErrorMessage('')
  }

  const handleClose = async () => {
    setClosed(true)
    if (!activeVisitor) return

    await saveConversationSummary({
      nextMessages: messages,
      nextSummary: summary || 'Conversation closed before a full summary was generated.',
      lastUserMessage:
        [...messages]
          .reverse()
          .find((item) => item.speaker === 'user')
          ?.message || '',
      lastAssistantMessage:
        [...messages]
          .reverse()
          .find((item) => item.speaker === 'assistant')
          ?.message || '',
      status: 'closed',
    })
  }

  const openAssistant = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false
      return
    }

    setClosed(false)
    setMinimized(false)
    setUnreadCount(0)
    setOpeningAnimation(dockSide)
    setPosition((current) => fitExpandedWidget(current))
  }

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const widget = widgetRef.current
    if (!widget) return

    const rect = widget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    dragMovedRef.current = false

    const handleMove = (moveEvent: PointerEvent) => {
      if (Math.abs(moveEvent.clientX - event.clientX) > 3 || Math.abs(moveEvent.clientY - event.clientY) > 3) {
        dragMovedRef.current = true
      }
      const maxX = Math.max(16, window.innerWidth - rect.width - 12)
      const maxY = Math.max(72, window.innerHeight - rect.height - 12)
      setPosition({
        x: clamp(moveEvent.clientX - offsetX, 16, maxX),
        y: clamp(moveEvent.clientY - offsetY, 72, maxY),
      })
    }

    const handleUp = () => {
      if (minimizedRef.current) {
        setPosition((current) => {
          const next = dockToNearestEdge(current, rect.width, rect.height)
          setDockSide(next.x <= 20 ? 'left' : 'right')
          return next
        })
      }
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  if (!isVisibleRoute) return null
  if (!settings.enabled) return null

  const launcher = (
    <button
      type="button"
      onClick={openAssistant}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition hover:bg-slate-900"
      aria-label="Open GILBERT assistant"
      title="Open GILBERT"
    >
      <Bot className="h-5 w-5 text-cyan-300" />
    </button>
  )

  if (closed) {
    return (
      <div className="fixed bottom-5 right-5 z-[70]">
        <div className="relative">
          {launcher}
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  if (minimized) {
    const dockedToLeft = dockSide === 'left'
    return (
      <div
        ref={widgetRef}
        className="fixed z-[70]"
        style={{ left: position.x, top: position.y }}
        onPointerDown={startDrag}
      >
        <div className="relative">
          <button
            type="button"
            onClick={openAssistant}
            className={[
              'flex h-14 w-14 items-center justify-center bg-slate-950 text-white shadow-2xl shadow-slate-950/30 transition hover:bg-slate-900',
              dockedToLeft
                ? '-ml-2 rounded-full rounded-l-[1.75rem] pl-2'
                : '-mr-2 rounded-full rounded-r-[1.75rem] pr-2',
            ].join(' ')}
            aria-label="Open GILBERT assistant"
            title="Open GILBERT"
          >
            <Bot className="h-6 w-6 text-cyan-300" />
          </button>
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={widgetRef}
      className={[
        'fixed z-[70] w-[min(360px,calc(100vw-24px))] transition-transform duration-200 ease-out',
        openingAnimation === 'left' ? 'translate-x-2' : '',
        openingAnimation === 'right' ? '-translate-x-2' : '',
      ].join(' ')}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex h-[min(520px,calc(100vh-96px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25">
        <div
          className="flex cursor-grab items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white"
          onPointerDown={startDrag}
        >
            <div className="min-w-0">
              <button
                type="button"
                className="flex items-center gap-2 text-left text-sm font-semibold text-white transition hover:text-cyan-200"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() =>
                  setMessages((current) => {
                    const alreadyExplained = current.some((item) =>
                      item.speaker === 'assistant' && item.message.includes('https://tuyambaze-gilbert.vercel.app/')
                    )

                    if (alreadyExplained) return current

                    return [
                      ...current,
                      {
                        id: `assistant-about-${Date.now()}`,
                        speaker: 'assistant',
                        message:
                          'My full name is Tuyambaze Gilbert. If you want to learn more or fix me further, you can visit https://tuyambaze-gilbert.vercel.app/.',
                      },
                    ]
                  })
                }
                title="Ask about GILBERT"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                GILBERT
              </button>
              <p className="truncate text-xs uppercase tracking-[0.24em] text-slate-400">NSS Website Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <GripHorizontal className="h-4 w-4 text-slate-400" />
            <button
              type="button"
              className="rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setMinimized(true)}
              aria-label={minimized ? 'Expand assistant' : 'Minimize assistant'}
            >
              {minimized ? <ChevronUp className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => void handleClose()}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
            {!activeVisitor ? (
              <form className="flex h-full flex-col gap-3 px-4 py-4" onSubmit={handleIdentitySubmit}>
                <div className="space-y-1">
                  <LabelledField label="Your name" htmlFor="gilbert-visitor-name">
                    <Input
                      id="gilbert-visitor-name"
                      name="gilbert_visitor_name"
                      autoComplete="name"
                      value={identityDraft.name}
                      onChange={(event) => setIdentityDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Enter your name"
                    />
                  </LabelledField>
                </div>
                <div className="space-y-1">
                  <LabelledField label="Your email" htmlFor="gilbert-visitor-email">
                    <Input
                      id="gilbert-visitor-email"
                      name="gilbert_visitor_email"
                      type="email"
                      autoComplete="email"
                      value={identityDraft.email}
                      onChange={(event) => setIdentityDraft((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Enter your email"
                    />
                  </LabelledField>
                </div>
                {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
                <div className="mt-auto pt-2">
                  <Button type="submit" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                  Continue with GILBERT
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-xs text-slate-500">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-700">{activeVisitor.name}</p>
                    <p className="truncate">{activeVisitor.email}</p>
                  </div>
                  <Link to="/enroll" className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Admissions
                  </Link>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={message.speaker === 'assistant' ? 'max-w-[92%]' : 'ml-auto max-w-[92%]'}
                    >
                      <div
                        className={
                          message.speaker === 'assistant'
                            ? 'rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2 text-sm text-slate-700'
                            : 'rounded-2xl rounded-tr-md bg-cyan-500 px-3 py-2 text-sm text-slate-950'
                        }
                      >
                        {message.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="space-y-3 border-t border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleQuickPrompt(prompt)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    id="gilbert-message"
                    name="gilbert_message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask GILBERT about admissions, events, news, or public school information..."
                    className="min-h-[92px] resize-none"
                  />
                  {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Public assistance only. For private student or staff tasks, use the NSS Digital System.
                    </p>
                    <Button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={working || !draft.trim()}
                      className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    >
                      <Send className="h-4 w-4" />
                      {working ? 'Thinking...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  )
}

function LabelledField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </>
  )
}

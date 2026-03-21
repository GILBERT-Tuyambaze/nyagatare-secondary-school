import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { BoardMemberForm } from '@/components/BoardMemberForm'
import { BoardMember, ContentPost, Event, NewsletterSubscriber } from '@/types/database'
import {
  deleteBoardMember,
  deleteContentPost,
  deleteEvent,
  getAllBoardMembers,
  getContentPosts,
  getEvents,
  getNewsletterSubscribers,
  updateContentPost,
} from '@/services/firestoreService'
import { Download, Edit, FilePenLine, Mail, Plus, Search, ShieldCheck, Trash2, Users } from 'lucide-react'
import { Card } from '../components/Card'
import { ContentPostForm } from '../components/ContentPostForm'
import { EventEditorForm } from '../components/EventEditorForm'

const sectionItems = [
  { id: 'content-studio', label: 'Content and Audience', icon: FilePenLine, note: 'Events, news, and blog publishing desk' },
  { id: 'governance', label: 'Governance and Board Members', icon: ShieldCheck, note: 'Leadership and public governance profiles' },
  { id: 'subscribers', label: 'Newsletter Subscribers', icon: Mail, note: 'Public audience and newsletter activity' },
] as const

export default function ContentPage() {
  const { accessProfile, hasRole } = useAuth()
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [boardSearch, setBoardSearch] = useState('')
  const [boardCategory, setBoardCategory] = useState<'all' | BoardMember['category']>('all')
  const [contentSearch, setContentSearch] = useState('')
  const [contentType, setContentType] = useState<'all' | ContentPost['type']>('all')
  const [contentStatus, setContentStatus] = useState<'all' | ContentPost['status']>('all')
  const [contentSort, setContentSort] = useState<'newest' | 'oldest' | 'alpha'>('newest')
  const [eventSearch, setEventSearch] = useState('')
  const [eventCategory, setEventCategory] = useState<'all' | Event['category']>('all')
  const [eventSort, setEventSort] = useState<'soonest' | 'latest' | 'alpha'>('soonest')
  const [contentFormOpen, setContentFormOpen] = useState(false)
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [boardFormOpen, setBoardFormOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null)
  const [message, setMessage] = useState('')

  const canManageBoard = hasRole(['SuperAdmin', 'Headmaster', 'ContentManager'])
  const canManageContentStudio = hasRole(['SuperAdmin', 'Headmaster', 'ContentManager', 'DOS', 'DOD', 'HOD'])

  const loadContentData = async () => {
    const [subscriberData, boardData, postData, eventsData] = await Promise.all([
      getNewsletterSubscribers(),
      getAllBoardMembers(),
      getContentPosts(),
      getEvents(),
    ])
    setSubscribers(subscriberData)
    setBoardMembers(boardData)
    setContentPosts(postData)
    setEvents(eventsData)
  }

  useEffect(() => {
    loadContentData()
  }, [])

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const term = subscriberSearch.trim().toLowerCase()
    if (!term) return true
    return (
      subscriber.email.toLowerCase().includes(term) ||
      subscriber.source.toLowerCase().includes(term) ||
      (subscriber.source_label || '').toLowerCase().includes(term)
    )
  })

  const filteredBoardMembers = useMemo(() => {
    const term = boardSearch.trim().toLowerCase()
    return boardMembers.filter((member) => {
      const matchesSearch =
        !term ||
        member.full_name.toLowerCase().includes(term) ||
        member.position.toLowerCase().includes(term) ||
        (member.email || '').toLowerCase().includes(term)
      const matchesCategory = boardCategory === 'all' || member.category === boardCategory
      return matchesSearch && matchesCategory
    })
  }, [boardMembers, boardCategory, boardSearch])

  const filteredContentPosts = useMemo(() => {
    const term = contentSearch.trim().toLowerCase()
    const entries = contentPosts.filter((post) => {
      const matchesSearch =
        !term ||
        post.title.toLowerCase().includes(term) ||
        (post.excerpt || '').toLowerCase().includes(term) ||
        post.slug.toLowerCase().includes(term)
      const matchesType = contentType === 'all' || post.type === contentType
      const matchesStatus = contentStatus === 'all' || post.status === contentStatus
      return matchesSearch && matchesType && matchesStatus
    })

    if (contentSort === 'alpha') {
      return [...entries].sort((left, right) => left.title.localeCompare(right.title))
    }

    return [...entries].sort((left, right) => {
      const leftTime = new Date(left.updated_at).getTime()
      const rightTime = new Date(right.updated_at).getTime()
      return contentSort === 'oldest' ? leftTime - rightTime : rightTime - leftTime
    })
  }, [contentPosts, contentSearch, contentSort, contentStatus, contentType])

  const filteredEvents = useMemo(() => {
    const term = eventSearch.trim().toLowerCase()
    const entries = events.filter((entry) => {
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        (entry.description || '').toLowerCase().includes(term) ||
        (entry.location || '').toLowerCase().includes(term)
      const matchesCategory = eventCategory === 'all' || entry.category === eventCategory
      return matchesSearch && matchesCategory
    })

    if (eventSort === 'alpha') {
      return [...entries].sort((left, right) => left.title.localeCompare(right.title))
    }

    return [...entries].sort((left, right) => {
      const leftTime = new Date(left.event_date).getTime()
      const rightTime = new Date(right.event_date).getTime()
      return eventSort === 'soonest' ? leftTime - rightTime : rightTime - leftTime
    })
  }, [eventCategory, eventSearch, eventSort, events])

  const handleSubscriberExport = () => {
    const header = ['Email', 'Source', 'Status', 'Subscribed At']
    const rows = filteredSubscribers.map((subscriber) => [
      subscriber.email,
      subscriber.source_label || subscriber.source,
      subscriber.status || 'subscribed',
      new Date(subscriber.created_at).toISOString(),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'nss-newsletter-subscribers.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getCategoryLabel = (category: BoardMember['category']) => {
    if (category === 'leader') return 'Leadership'
    if (category === 'teacher') return 'Teacher'
    return 'Parent'
  }

  const handleDeleteMember = async (member: BoardMember) => {
    if (!window.confirm(`Delete ${member.full_name} from governance records?`)) return
    try {
      await deleteBoardMember(member.id)
      setMessage('Board member removed from governance records.')
      await loadContentData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete board member.')
    }
  }

  const handleDeletePost = async (post: ContentPost) => {
    if (!window.confirm(`Delete "${post.title}" from the publishing desk?`)) return
    try {
      await deleteContentPost(post.id)
      setMessage('Content entry deleted successfully.')
      await loadContentData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete content entry.')
    }
  }

  const handleDeleteEvent = async (eventItem: Event) => {
    if (!window.confirm(`Delete "${eventItem.title}" from the school calendar?`)) return
    try {
      await deleteEvent(eventItem.id)
      setMessage('Event deleted successfully.')
      await loadContentData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete event.')
    }
  }

  const publishContentPost = async (post: ContentPost) => {
    try {
      await updateContentPost(post.id, {
        status: 'published',
        published_at: post.published_at || new Date().toISOString(),
      })
      setMessage(`"${post.title}" is now published.`)
      await loadContentData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to publish content entry.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-28 xl:self-start">
          <Card title="Content Desk" description="Jump between the publishing desk, governance, and audience sections.">
            <div className="flex gap-3 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
              {sectionItems.map((section) => {
                const Icon = section.icon
                return (
                  <a key={section.id} href={`#${section.id}`} className="min-w-[220px] rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-cyan-400/40 hover:bg-slate-900 xl:min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{section.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{section.note}</p>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </Card>
        </aside>

        <div className="space-y-6">
          <section id="content-studio" className="scroll-mt-28">
            <Card title="Content and Audience" description="Live publishing tools for events, news, announcements, and the new public blog page.">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Content Entries</p>
                    <p className="mt-2 text-3xl font-bold text-white">{contentPosts.length}</p>
                    <p className="mt-2 text-sm text-slate-300">News, announcements, and blog stories.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Calendar Events</p>
                    <p className="mt-2 text-3xl font-bold text-white">{events.length}</p>
                    <p className="mt-2 text-sm text-slate-300">Live events for the school calendar.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Published Stories</p>
                    <p className="mt-2 text-3xl font-bold text-white">{contentPosts.filter((post) => post.status === 'published').length}</p>
                    <p className="mt-2 text-sm text-slate-300">Visible on the public-facing pages.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm text-slate-400">Your Desk</p>
                    <p className="mt-2 text-3xl font-bold text-white">{accessProfile.role}</p>
                    <p className="mt-2 text-sm text-slate-300">Publishing under {accessProfile.displayName}.</p>
                  </div>
                </div>

                <div className="grid gap-6 2xl:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">News, Blog, and Announcements</p>
                        <p className="mt-1 text-sm text-slate-400">Manage searchable stories and the publication workflow.</p>
                      </div>
                      {canManageContentStudio ? (
                        <Button type="button" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => { setSelectedPost(null); setContentFormOpen(true) }}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Entry
                        </Button>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input value={contentSearch} onChange={(event) => setContentSearch(event.target.value)} placeholder="Search title, excerpt, or slug" className="border-slate-700 bg-slate-950/80 pl-10 text-slate-100 placeholder:text-slate-500" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Select value={contentType} onValueChange={(value: 'all' | ContentPost['type']) => setContentType(value)}>
                          <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="news">News</SelectItem>
                            <SelectItem value="blog">Blog</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={contentStatus} onValueChange={(value: 'all' | ContentPost['status']) => setContentStatus(value)}>
                          <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={contentSort} onValueChange={(value: 'newest' | 'oldest' | 'alpha') => setContentSort(value)}>
                          <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            <SelectItem value="newest">Newest updated</SelectItem>
                            <SelectItem value="oldest">Oldest updated</SelectItem>
                            <SelectItem value="alpha">Alphabetical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredContentPosts.length > 0 ? filteredContentPosts.map((post) => (
                        <div key={post.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white">{post.title}</p>
                                <Badge className="bg-slate-800 text-slate-200 hover:bg-slate-800">{post.type}</Badge>
                                <Badge className={post.status === 'published' ? 'bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10' : 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/10'}>{post.status}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-slate-300">{post.excerpt || 'No excerpt added yet.'}</p>
                              <p className="mt-2 text-xs text-slate-400">/{post.slug} | Updated {new Date(post.updated_at).toLocaleString()}</p>
                            </div>
                            {canManageContentStudio ? (
                              <div className="flex flex-wrap gap-2">
                                {post.status !== 'published' ? <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => publishContentPost(post)}>Publish</Button> : null}
                                <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => { setSelectedPost(post); setContentFormOpen(true) }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button type="button" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => handleDeletePost(post)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )) : <p className="text-sm text-slate-400">No content entries match your search, status, or type filters.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">Event Operations</p>
                        <p className="mt-1 text-sm text-slate-400">Control the live school calendar with editing, deletion, search, and sorting.</p>
                      </div>
                      {canManageContentStudio ? (
                        <Button type="button" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => { setSelectedEvent(null); setEventFormOpen(true) }}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Event
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search event, location, or description" className="border-slate-700 bg-slate-950/80 pl-10 text-slate-100 placeholder:text-slate-500" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 md:col-span-1">
                        <Select value={eventCategory} onValueChange={(value: 'all' | Event['category']) => setEventCategory(value)}>
                          <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            <SelectItem value="all">All categories</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="cultural">Cultural</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="ceremony">Ceremony</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={eventSort} onValueChange={(value: 'soonest' | 'latest' | 'alpha') => setEventSort(value)}>
                          <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            <SelectItem value="soonest">Soonest date</SelectItem>
                            <SelectItem value="latest">Latest date</SelectItem>
                            <SelectItem value="alpha">Alphabetical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredEvents.length > 0 ? filteredEvents.map((eventItem) => (
                        <div key={eventItem.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white">{eventItem.title}</p>
                                <Badge className="bg-slate-800 text-slate-200 hover:bg-slate-800">{eventItem.category}</Badge>
                                <Badge className={eventItem.status === 'upcoming' ? 'bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10' : 'bg-slate-800 text-slate-300 hover:bg-slate-800'}>{eventItem.status}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-slate-300">{eventItem.description || 'No event description added yet.'}</p>
                              <p className="mt-2 text-xs text-slate-400">{new Date(eventItem.event_date).toLocaleDateString()} | {eventItem.location || 'Location TBD'} | {eventItem.current_attendees} attending</p>
                            </div>
                            {canManageContentStudio ? (
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => { setSelectedEvent(eventItem); setEventFormOpen(true) }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button type="button" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => handleDeleteEvent(eventItem)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )) : <p className="text-sm text-slate-400">No events match your current search and sort settings.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section id="governance" className="scroll-mt-28">
            <Card title="Governance and Board Members" description="Board profile management now sits beside the rest of your content work.">
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm text-slate-400">Total Members</p><p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white"><Users className="h-5 w-5 text-cyan-200" />{boardMembers.length}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm text-slate-400">Teachers</p><p className="mt-2 text-2xl font-semibold text-white">{boardMembers.filter((member) => member.category === 'teacher').length}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm text-slate-400">Leadership</p><p className="mt-2 text-2xl font-semibold text-white">{boardMembers.filter((member) => member.category === 'leader').length}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-sm text-slate-400">Parents</p><p className="mt-2 text-2xl font-semibold text-white">{boardMembers.filter((member) => member.category === 'parent').length}</p></div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input value={boardSearch} onChange={(event) => setBoardSearch(event.target.value)} placeholder="Search board member, position, or email" className="border-slate-700 bg-slate-950/80 pl-10 text-slate-100 placeholder:text-slate-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'teacher', 'leader', 'parent'] as const).map((category) => (
                      <Button key={category} type="button" variant="outline" className={boardCategory === category ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/10' : 'border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800'} onClick={() => setBoardCategory(category)}>
                        {category === 'all' ? 'All Categories' : getCategoryLabel(category)}
                      </Button>
                    ))}
                  </div>
                  {canManageBoard ? (
                    <Button type="button" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => { setSelectedMember(null); setBoardFormOpen(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Board Member
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {filteredBoardMembers.length > 0 ? filteredBoardMembers.map((member) => (
                    <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">{member.full_name}</p>
                            <Badge className="bg-slate-800 text-slate-200 hover:bg-slate-800">{getCategoryLabel(member.category)}</Badge>
                            <Badge className={member.is_active ? 'bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10' : 'bg-slate-800 text-slate-300 hover:bg-slate-800'}>{member.is_active ? 'Active' : 'Inactive'}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{member.position}</p>
                          <p className="mt-1 text-xs text-slate-400">{[member.email, member.phone, member.qualifications].filter(Boolean).join(' | ') || 'No additional profile details yet.'}</p>
                        </div>
                        {canManageBoard ? (
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => { setSelectedMember(member); setBoardFormOpen(true) }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button type="button" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => handleDeleteMember(member)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-400">No board members match your current search and category filter.</p>}
                </div>
              </div>
            </Card>
          </section>

          <section id="subscribers" className="scroll-mt-28">
            <Card title="Newsletter Subscribers" description="Public audience collected from the footer and events page newsletter forms.">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <p className="text-sm text-slate-400">Current Audience</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{filteredSubscribers.length}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[260px]">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input value={subscriberSearch} onChange={(event) => setSubscriberSearch(event.target.value)} placeholder="Search subscriber email or source" className="border-slate-700 bg-slate-950/80 pl-10 text-slate-100 placeholder:text-slate-500" />
                    </div>
                    <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={handleSubscriberExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredSubscribers.length > 0 ? filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-white">{subscriber.email}</p>
                        <Badge className="bg-slate-800 text-slate-200 hover:bg-slate-800">{subscriber.source_label || subscriber.source}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Status: {subscriber.status || 'subscribed'} | Sources: {(subscriber.sources && subscriber.sources.length > 0 ? subscriber.sources : [subscriber.source]).join(', ')} | Subscribed {new Date(subscriber.created_at).toLocaleString()}</p>
                    </div>
                  )) : <p className="text-sm text-slate-400">No newsletter subscribers match your search yet.</p>}
                </div>
              </div>
            </Card>
          </section>

          {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
        </div>
      </div>

      {canManageContentStudio ? (
        <>
          <ContentPostForm open={contentFormOpen} onOpenChange={setContentFormOpen} post={selectedPost} authorName={accessProfile.displayName} onSuccess={() => { setMessage(selectedPost ? 'Content entry updated successfully.' : 'Content entry created successfully.'); loadContentData() }} />
          <EventEditorForm open={eventFormOpen} onOpenChange={setEventFormOpen} eventItem={selectedEvent} authorName={accessProfile.displayName} onSuccess={() => { setMessage(selectedEvent ? 'Event updated successfully.' : 'Event created successfully.'); loadContentData() }} />
        </>
      ) : null}

      {canManageBoard ? (
        <BoardMemberForm open={boardFormOpen} onOpenChange={setBoardFormOpen} member={selectedMember} onSuccess={() => { setMessage(selectedMember ? 'Board member updated successfully.' : 'Board member added successfully.'); loadContentData() }} />
      ) : null}
    </div>
  )
}

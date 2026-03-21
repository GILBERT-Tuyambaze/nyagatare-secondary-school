import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpenText, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Seo from '@/components/Seo'
import { getContentPosts } from '@/services/firestoreService'
import { ContentPost } from '@/types/database'

export default function Blog() {
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | ContentPost['type']>('all')
  const [activePostId, setActivePostId] = useState('')

  useEffect(() => {
    getContentPosts().then((entries) => {
      const publishedEntries = entries.filter((entry) => entry.status === 'published')
      setPosts(publishedEntries)
      if (publishedEntries[0]) {
        const firstNews = publishedEntries.find((entry) => entry.type === 'news')
        setActivePostId((firstNews || publishedEntries[0]).id)
      }
    })
  }, [])

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matchingPosts = posts.filter((post) => {
      const matchesSearch =
        !term ||
        post.title.toLowerCase().includes(term) ||
        (post.excerpt || '').toLowerCase().includes(term) ||
        post.body.toLowerCase().includes(term)
      const matchesType = type === 'all' || post.type === type
      return matchesSearch && matchesType
    })

    return [...matchingPosts].sort((left, right) => {
      const order = { news: 0, blog: 1, announcement: 2 }
      const typeDifference = order[left.type] - order[right.type]
      if (typeDifference !== 0) return typeDifference
      return new Date(right.published_at || right.updated_at).getTime() - new Date(left.published_at || left.updated_at).getTime()
    })
  }, [posts, search, type])

  const newsPosts = filteredPosts.filter((post) => post.type === 'news')
  const blogPosts = filteredPosts.filter((post) => post.type === 'blog')
  const otherPosts = filteredPosts.filter((post) => post.type === 'announcement')
  const activePost = filteredPosts.find((post) => post.id === activePostId) || filteredPosts[0] || null

  const renderCards = (entries: ContentPost[], label: string) => (
    <div className="grid gap-8 lg:grid-cols-2">
      {entries.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => setActivePostId(post.id)}
          className={`overflow-hidden rounded-[2rem] border bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${activePost?.id === post.id ? 'border-amber-500 shadow-lg shadow-amber-100' : 'border-slate-200'}`}
        >
          {post.featured_image ? (
            <div className="h-56">
              <img src={post.featured_image} alt={post.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className={`flex h-56 items-center justify-center text-white ${label === 'Blog' ? 'bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)]' : 'bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)]'}`}>
              <BookOpenText className="h-14 w-14" />
            </div>
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{post.type}</Badge>
              <div className="flex items-center text-sm text-slate-500">
                <CalendarDays className="mr-1 h-4 w-4" />
                {new Date(post.published_at || post.updated_at).toLocaleDateString()}
              </div>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">{post.title}</h3>
            <p className="mt-3 text-slate-600">{post.excerpt || post.body.slice(0, 180)}</p>
            <p className="mt-5 text-sm font-semibold text-amber-700">
              {label === 'News' ? 'Read this news' : label === 'Blog' ? 'Read this blog' : 'Open announcement'}
            </p>
          </div>
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)]">
      <Seo
        title="School Blog and News | Nyagatare Secondary School"
        description="Read school news, digital learning stories, and official announcements from Nyagatare Secondary School."
        path="/blog"
      />
      <Header />
      <main id="main-content" className="pb-20 pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mb-4 flex items-center justify-center">
              <Link to="/" className="mr-4 flex items-center text-amber-700 hover:text-amber-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Newsroom</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">NSS News and Blog</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 md:text-xl">
              Follow school stories, digital leadership updates, and official announcements from Nyagatare Secondary School.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search school stories, blog posts, or announcements"
              className="md:max-w-xl"
            />
            <div className="flex flex-wrap gap-2">
              {(['all', 'news', 'blog', 'announcement'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  className={type === value ? 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}
                  onClick={() => setType(value)}
                >
                  {value === 'all' ? 'All Posts' : value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {activePost ? (
            <article className="mb-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {activePost.featured_image ? (
                <div className="h-72">
                  <img src={activePost.featured_image} alt={activePost.title} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{activePost.type}</Badge>
                  <div className="flex items-center text-sm text-slate-500">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    {new Date(activePost.published_at || activePost.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">{activePost.title}</h2>
                <p className="mt-4 text-lg text-slate-600">{activePost.excerpt || 'Full story from the NSS newsroom.'}</p>
                <div className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">{activePost.body}</div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <span className="text-sm font-medium text-slate-500">{activePost.author_name || 'NSS Editorial Desk'}</span>
                  <span className="text-sm text-amber-700">/{activePost.slug}</span>
                </div>
              </div>
            </article>
          ) : null}

          <div className="space-y-10">
            <section>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">First Section</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">News</h2>
                </div>
                <Badge className="bg-slate-900 text-white hover:bg-slate-900">{newsPosts.length}</Badge>
              </div>
              {renderCards(newsPosts, 'News')}
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Second Section</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">Blog</h2>
                </div>
                <Badge className="bg-slate-900 text-white hover:bg-slate-900">{blogPosts.length}</Badge>
              </div>
              {renderCards(blogPosts, 'Blog')}
            </section>

            {otherPosts.length ? (
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Other Content</p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">Announcements</h2>
                  </div>
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900">{otherPosts.length}</Badge>
                </div>
                {renderCards(otherPosts, 'Announcement')}
              </section>
            ) : null}
          </div>

          {!filteredPosts.length ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">No published posts match that search yet.</h2>
              <p className="mt-3 text-slate-600">Try a broader search or switch the content type filter.</p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}

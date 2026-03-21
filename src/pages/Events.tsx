import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Seo from '@/components/Seo';
import ContentMediaCarousel from '@/components/ContentMediaCarousel';
import { createNewsletterSubscriber, getEvents } from '@/services/firestoreService';
import { ContentMediaItem, Event } from '@/types/database';

const getEventMedia = (event: Event): ContentMediaItem[] => {
  if (event.media_gallery?.length) return event.media_gallery
  if (!event.image_url) return []

  return [
    {
      id: `${event.id}-featured`,
      type: 'image',
      source: 'link',
      url: event.image_url,
      preview_url: event.image_url,
      title: event.title,
    },
  ]
}

const getEventCardImage = (event: Event) => {
  const firstImage = getEventMedia(event).find((item) => item.type === 'image')
  return firstImage?.preview_url || firstImage?.url || event.image_url || '/images/STEMFair.jpg'
}

const Events = () => {
  const [filter, setFilter] = useState('all');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriberMessage, setSubscriberMessage] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventId] = useState('');

  useEffect(() => {
    getEvents().then((entries) => {
      setEvents(entries)
      if (entries[0]) setActiveEventId(entries[0].id)
    })
  }, [])

  const categories = [
    { id: 'all', name: 'All Events', color: 'bg-gray-100 text-gray-800' },
    { id: 'academic', name: 'Academic', color: 'bg-blue-100 text-blue-800' },
    { id: 'sports', name: 'Sports', color: 'bg-green-100 text-green-800' },
    { id: 'meeting', name: 'Meetings', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'ceremony', name: 'Ceremonies', color: 'bg-purple-100 text-purple-800' },
    { id: 'cultural', name: 'Cultural', color: 'bg-orange-100 text-orange-800' }
  ];

  const filteredEvents = useMemo(
    () => (filter === 'all' ? events : events.filter((event) => event.category === filter)),
    [events, filter]
  )

  useEffect(() => {
    if (!filteredEvents.find((event) => event.id === activeEventId) && filteredEvents[0]) {
      setActiveEventId(filteredEvents[0].id)
    }
  }, [activeEventId, filteredEvents])

  const activeEvent = filteredEvents.find((event) => event.id === activeEventId) || filteredEvents[0] || null

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubscribe = async () => {
    setSubscribing(true)
    setSubscriberMessage('')

    try {
      const result = await createNewsletterSubscriber({ email: subscriberEmail, source: 'events' })
      setSubscriberMessage(
        result.duplicate
          ? 'This email is already subscribed. We refreshed your Events Page updates.'
          : 'You are now subscribed to event and school updates from the Events Page.'
      )
      setSubscriberEmail('')
    } catch (error) {
      setSubscriberMessage(error instanceof Error ? error.message : 'Failed to subscribe right now.')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)]">
      <Seo
        title="School Events | Nyagatare Secondary School"
        description="Explore academic events, ceremonies, parent meetings, sports, and cultural activities at Nyagatare Secondary School."
        path="/events"
        keywords={[
          'Nyagatare Secondary School events',
          'school events in Rwanda',
          'Nyagatare District school calendar',
          'Rwanda secondary school events',
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Nyagatare Secondary School Events',
          url: 'https://www.nyagataress.edu.rw/events',
          about: {
            '@type': 'School',
            name: 'Nyagatare Secondary School',
          },
        }}
      />
      <Header />
      
      <main id="main-content" className="pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mb-4 flex items-center justify-center">
              <Link to="/" className="mr-4 flex items-center text-amber-700 hover:text-amber-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">School Calendar</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">School Events</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 md:text-xl">
              Stay updated with all the exciting events happening at Nyagatare Secondary School. 
              From academic competitions to cultural celebrations, there's always something happening on our campus.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === category.id
                    ? 'bg-amber-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {activeEvent ? (
            <div className="mb-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {getEventMedia(activeEvent).length ? <ContentMediaCarousel items={getEventMedia(activeEvent)} title={activeEvent.title} /> : null}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getCategoryColor(activeEvent.category)}>{activeEvent.category}</Badge>
                  <Badge variant={activeEvent.status === 'upcoming' ? 'default' : 'secondary'}>
                    {activeEvent.status}
                  </Badge>
                </div>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">{activeEvent.title}</h2>
                <p className="mt-4 text-lg text-slate-600">{activeEvent.description || 'Event details from the NSS calendar.'}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center text-sm font-medium text-slate-500"><Calendar className="mr-2 h-4 w-4" />Date</div>
                    <p className="mt-2 text-sm text-slate-800">{formatDate(activeEvent.event_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center text-sm font-medium text-slate-500"><Clock className="mr-2 h-4 w-4" />Time</div>
                    <p className="mt-2 text-sm text-slate-800">{[activeEvent.start_time, activeEvent.end_time].filter(Boolean).join(' - ') || 'Time to be confirmed'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center text-sm font-medium text-slate-500"><MapPin className="mr-2 h-4 w-4" />Location</div>
                    <p className="mt-2 text-sm text-slate-800">{activeEvent.location || 'Campus venue to be confirmed'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center text-sm font-medium text-slate-500"><Users className="mr-2 h-4 w-4" />Attendance</div>
                    <p className="mt-2 text-sm text-slate-800">{activeEvent.current_attendees} expected attendees</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Events Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className={`overflow-hidden border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${activeEvent?.id === event.id ? 'ring-2 ring-amber-500/70' : ''}`}
              >
                {/* Event Image */}
                <div className="h-48 relative">
                  <img
                    src={getEventCardImage(event)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute top-4 left-4">
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(event.event_date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {[event.start_time, event.end_time].filter(Boolean).join(' - ') || 'Time to be confirmed'}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {event.current_attendees} expected attendees
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      variant={event.status === 'upcoming' ? 'default' : 'outline'}
                      disabled={event.status === 'completed' || event.status === 'cancelled'}
                      onClick={() => setActiveEventId(event.id)}
                    >
                      {event.status === 'upcoming' ? 'Open Event' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try selecting a different category filter.</p>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Want to Stay Updated?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-slate-600">
              Subscribe to our newsletter to receive notifications about upcoming events, 
              registration deadlines, and important school announcements.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex flex-col gap-4 sm:flex-row">
              <label htmlFor="events-newsletter-email" className="sr-only">
                Email address for event updates
              </label>
              <input
                id="events-newsletter-email"
                name="eventsNewsletterEmail"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
              />
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSubscribe} disabled={subscribing}>
                {subscribing ? 'Subscribing...' : 'Subscribe for Updates'}
              </Button>
              </div>
              {subscriberMessage ? <p className="mt-3 text-sm text-slate-500">{subscriberMessage}</p> : null}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;

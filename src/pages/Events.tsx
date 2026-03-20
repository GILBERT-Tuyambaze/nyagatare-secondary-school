import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Events = () => {
  const [filter, setFilter] = useState('all');

  const events = [
    {
      id: 1,
      title: 'STEM Fair 2025',
      description: 'Annual science, technology, engineering, and mathematics exhibition featuring student projects.',
      date: '2025-03-15',
      time: '9:00 AM - 4:00 PM',
      location: 'School Auditorium',
      category: 'academic',
      attendees: 250,
      status: 'upcoming',
      image: '/images/STEMFair.jpg'
    },
    {
      id: 2,
      title: 'Parent-Teacher Conference',
      description: 'Meet with teachers to discuss student progress and academic performance.',
      date: '2025-02-28',
      time: '2:00 PM - 6:00 PM',
      location: 'Classroom Buildings',
      category: 'meeting',
      attendees: 180,
      status: 'upcoming',
      image: '/images/ParentTeacherMeeting.jpg'
    },
    {
      id: 3,
      title: 'Inter-School Football Championship',
      description: 'Annual football tournament between secondary schools in the Eastern Province.',
      date: '2025-04-10',
      time: '10:00 AM - 5:00 PM',
      location: 'School Football Field',
      category: 'sports',
      attendees: 500,
      status: 'upcoming',
      image: '/images/football.jpg'
    },
    {
      id: 4,
      title: 'Graduation Ceremony 2024',
      description: 'Celebrating the achievements of our graduating class of 2024.',
      date: '2024-12-15',
      time: '10:00 AM - 2:00 PM',
      location: 'School Auditorium',
      category: 'ceremony',
      attendees: 400,
      status: 'past',
      image: '/images/graduation.jpg'
    },
    {
      id: 5,
      title: 'Science Laboratory Open Day',
      description: 'Tour our state-of-the-art science laboratories and meet our faculty.',
      date: '2025-02-20',
      time: '1:00 PM - 4:00 PM',
      location: 'Science Building',
      category: 'academic',
      attendees: 120,
      status: 'upcoming',
      image: '/images/Lab.jpg'
    },
    {
      id: 6,
      title: 'Cultural Heritage Day',
      description: 'Celebrating Rwandan culture through music, dance, and traditional arts.',
      date: '2025-05-25',
      time: '11:00 AM - 6:00 PM',
      location: 'School Courtyard',
      category: 'cultural',
      attendees: 600,
      status: 'upcoming',
      image: '/images/cultural-day.jpg'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Events', color: 'bg-gray-100 text-gray-800' },
    { id: 'academic', name: 'Academic', color: 'bg-blue-100 text-blue-800' },
    { id: 'sports', name: 'Sports', color: 'bg-green-100 text-green-800' },
    { id: 'meeting', name: 'Meetings', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'ceremony', name: 'Ceremonies', color: 'bg-purple-100 text-purple-800' },
    { id: 'cultural', name: 'Cultural', color: 'bg-orange-100 text-orange-800' }
  ];

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.category === filter);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Link to="/" className="flex items-center text-orange-600 hover:text-orange-700 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">School Events</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image */}
                <div className="h-48 relative">
                  <img
                    src={event.image}
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
                      {formatDate(event.date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {event.time}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {event.attendees} expected attendees
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      variant={event.status === 'upcoming' ? 'default' : 'outline'}
                      disabled={event.status === 'past'}
                    >
                      {event.status === 'upcoming' ? 'Register Interest' : 'View Details'}
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
          <div className="mt-16 bg-white rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Want to Stay Updated?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive notifications about upcoming events, 
              registration deadlines, and important school announcements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Button className="bg-orange-500 hover:bg-orange-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Events;

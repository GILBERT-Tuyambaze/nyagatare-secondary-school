import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock } from 'lucide-react';

const Events = () => {
  const events = [
    {
      date: 'Sep 15',
      title: 'Science Fair 2025',
      time: '9:00 AM - 4:00 PM',
      location: 'Main Campus',
      description: 'Annual science exhibition showcasing student projects and innovations.'
    },
    {
      date: 'Sep 22',
      title: 'Open House',
      time: '2:00 PM - 5:00 PM',
      location: 'School Auditorium',
      description: 'Meet our faculty and explore our facilities. Perfect for prospective families.'
    },
    {
      date: 'Oct 5',
      title: 'STEM Competition',
      time: '10:00 AM - 3:00 PM',
      location: 'Laboratory Building',
      description: 'Inter-school competition featuring robotics, programming, and engineering challenges.'
    }
  ];

  return (
    <section id="events" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            UPCOMING EVENTS
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join us for exciting events that showcase our community and academic excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 text-orange-500 mb-2">
                  <Calendar size={20} />
                  <span className="font-semibold">{event.date}</span>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                <p className="text-gray-600">
                  {event.description}
                </p>
                <Button variant="outline" className="w-full mt-4">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4"
          >
            VIEW ALL EVENTS
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;
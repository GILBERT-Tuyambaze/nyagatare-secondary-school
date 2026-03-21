import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <section id="events" className="bg-slate-950 py-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">School Calendar</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold mb-4">
            Events that shape academic and campus life
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join academic showcases, community gatherings, and school moments that reflect the energy of NSS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event, index) => (
            <Card key={index} className="border-white/10 bg-white/5 text-white backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-2xl hover:shadow-cyan-950/20">
              <CardHeader>
                <div className="mb-2 flex items-center space-x-3 text-cyan-200">
                  <Calendar size={20} />
                  <span className="font-semibold">{event.date}</span>
                </div>
                <CardTitle className="text-xl font-bold text-white">
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                <p className="text-slate-300">
                  {event.description}
                </p>
                <Button variant="outline" className="mt-4 w-full border-white/20 bg-white/5 text-white hover:bg-white hover:text-slate-900">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="bg-cyan-300 px-8 py-4 text-slate-950 hover:bg-cyan-200">
            <Link to="/events">
              View Full Calendar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;

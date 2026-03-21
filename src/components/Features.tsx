import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Atom, Users, Award, Cpu, Trophy } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Atom className="h-8 w-8 text-amber-600" />,
      title: 'STEM Excellence',
      description: 'Advanced instruction in science and mathematics supported by laboratories, practical sessions, and strong academic guidance.'
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-amber-600" />,
      title: 'Academic Discipline',
      description: 'A structured learning culture that helps students build consistency, confidence, and readiness for higher education.'
    },
    {
      icon: <Cpu className="h-8 w-8 text-amber-600" />,
      title: 'Digital Readiness',
      description: 'School systems, applicant workflows, and student exposure to technology help learners grow in a digital-first environment.'
    },
    {
      icon: <Trophy className="h-8 w-8 text-amber-600" />,
      title: 'Top Tech Talent',
      description: 'NSS is known for producing some of its strongest students in technology, innovation, and problem-solving.'
    },
    {
      icon: <Users className="h-8 w-8 text-amber-600" />,
      title: 'Leadership Formation',
      description: 'Students are shaped through responsibility, teamwork, and character-building in and beyond the classroom.'
    },
    {
      icon: <Award className="h-8 w-8 text-amber-600" />,
      title: 'Future Preparation',
      description: 'Learners are prepared for university, entrepreneurship, and modern career opportunities through a serious academic foundation.'
    }
  ];

  return (
    <section id="academics" className="bg-[linear-gradient(180deg,#f8fafc_0%,#fffaf0_100%)] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Why Families Choose NSS
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Academic strength with a technology mindset
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Discover the academic, digital, and leadership qualities that make Nyagatare Secondary School stand out.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 bg-white/90 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-7">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

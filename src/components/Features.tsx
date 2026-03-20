import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Atom, Users, Award } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Atom className="w-8 h-8 text-orange-500" />,
      title: 'STEM Excellence',
      description: 'Advanced programs in Science, Technology, Engineering, and Mathematics with state-of-the-art laboratories and equipment.'
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-orange-500" />,
      title: 'Academic Excellence',
      description: 'Rigorous curriculum designed to prepare students for higher education and future career success.'
    },
    {
      icon: <Users className="w-8 h-8 text-orange-500" />,
      title: 'Inclusive Community',
      description: 'Welcoming environment for all students regardless of background, fostering diversity and collaboration.'
    },
    {
      icon: <Award className="w-8 h-8 text-orange-500" />,
      title: 'College Preparation',
      description: 'Comprehensive support system to ensure students are ready for university-level studies and beyond.'
    }
  ];

  return (
    <section id="academics" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            EXCELLENCE IN EDUCATION
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover what makes Nyagatare Secondary School a leader in STEM education and student development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
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
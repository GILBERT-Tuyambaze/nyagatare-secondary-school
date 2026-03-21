import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote, Cpu, Code2, Lightbulb } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Origene KWIZERA',
      class: 'Class of 2024',
      quote: 'NSS provided me with the foundation I needed for my engineering studies. The STEM programs are exceptional.',
      rating: 5,
      focus: 'Engineering pathway'
    },
    {
      name: 'Gilbert TUYAMBAZE',
      class: 'Class of 2024',
      quote: 'The supportive environment and dedicated teachers helped me discover my passion for computer science.',
      rating: 5,
      focus: 'Software and computing'
    },
    {
      name: 'Grace Mukamana',
      class: 'Class of 2025',
      quote: 'I felt prepared for university thanks to the rigorous academic programs and excellent facilities.',
      rating: 5,
      focus: 'Academic readiness'
    }
  ];

  return (
    <section className="bg-stone-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Student Outcomes</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            A school known for strong tech-minded students
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from learners and graduates who grew through rigorous academics, digital exposure, and a culture of ambition.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Cpu className="h-7 w-7 text-amber-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Tech-oriented learners</p>
            <p className="mt-2 text-slate-600">NSS continues to build a reputation for students who excel in computing, science, and modern problem-solving.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Code2 className="h-7 w-7 text-amber-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Digital confidence</p>
            <p className="mt-2 text-slate-600">Students grow familiar with structured digital tools, research habits, and academic technology from school level.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Lightbulb className="h-7 w-7 text-amber-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Innovation mindset</p>
            <p className="mt-2 text-slate-600">The learning culture encourages initiative, curiosity, and the confidence to build solutions, not only memorize content.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Quote className="text-orange-500 mr-2" size={20} />
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.class}</p>
                  <p className="mt-1 text-sm font-medium text-amber-700">{testimonial.focus}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EnrollmentCTA = () => {
  return (
    <section id="enroll" className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            JOIN OUR COMMUNITY
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Take the first step towards an exceptional STEM education. Our application process is designed to help us understand your goals and aspirations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="text-4xl font-bold mb-2">1</div>
              <h3 className="text-xl font-semibold mb-4">Submit Application</h3>
              <p className="opacity-90">
                Complete our online application form with your academic records and personal information.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="text-4xl font-bold mb-2">2</div>
              <h3 className="text-xl font-semibold mb-4">Assessment & Interview</h3>
              <p className="opacity-90">
                Participate in our assessment process and meet with our academic team.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="text-4xl font-bold mb-2">3</div>
              <h3 className="text-xl font-semibold mb-4">Welcome to NSS</h3>
              <p className="opacity-90">
                Join our community and begin your journey toward academic excellence.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Link to="/enroll">
            <Button 
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              START APPLICATION
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EnrollmentCTA;
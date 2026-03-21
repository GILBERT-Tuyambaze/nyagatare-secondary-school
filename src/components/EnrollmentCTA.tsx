import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EnrollmentCTA = () => {
  return (
    <section id="enroll" className="bg-[linear-gradient(135deg,#7c2d12_0%,#0f172a_50%,#0ea5e9_100%)] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Admissions Journey
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold mb-4">
            A modern application path into NSS
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            From application submission to applicant portal access, our admissions flow is designed to be clear, digital, and supportive for families.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-white/15 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="mb-2 text-4xl font-bold text-cyan-200">1</div>
              <h3 className="text-xl font-semibold mb-4">Submit Application</h3>
              <p className="opacity-90">
                Complete the digital form with applicant information, optional codes, and academic report details.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/15 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="mb-2 text-4xl font-bold text-cyan-200">2</div>
              <h3 className="text-xl font-semibold mb-4">Review and Decision</h3>
              <p className="opacity-90">
                Admissions leaders review the application, save notes, and publish a clear applicant decision.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/15 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center text-white">
              <div className="mb-2 text-4xl font-bold text-cyan-200">3</div>
              <h3 className="text-xl font-semibold mb-4">Secure Onboarding</h3>
              <p className="opacity-90">
                Accepted applicants continue with a one-time secure account link into the NSS digital platform.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Link to="/enroll">
            <Button 
              size="lg"
              className="bg-white px-8 py-4 text-lg font-semibold text-slate-950 hover:bg-slate-100"
            >
              Start Application
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EnrollmentCTA;

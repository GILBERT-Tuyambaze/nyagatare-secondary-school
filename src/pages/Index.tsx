import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Events from '@/components/Events';
import EnrollmentCTA from '@/components/EnrollmentCTA';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        <Hero />
        <section id="about">
          <Features />
        </section>
        <section id="academics">
          <div className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">Academic Programs</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Science & Mathematics</h3>
                  <p className="text-gray-600">Advanced programs in Physics, Chemistry, Biology, and Mathematics.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Languages & Literature</h3>
                  <p className="text-gray-600">English, French, Kinyarwanda, and literature studies.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Social Studies</h3>
                  <p className="text-gray-600">History, Geography, and Civic Education programs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="resources">
          <div className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">School Resources</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Library</h3>
                  <p className="text-gray-600">Modern library with over 5,000 books and digital resources.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Laboratory</h3>
                  <p className="text-gray-600">Well-equipped science labs for practical learning.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Sports Facilities</h3>
                  <p className="text-gray-600">Football field, basketball court, and indoor facilities.</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Computer Lab</h3>
                  <p className="text-gray-600">Modern computers with internet access for digital literacy.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="events">
          <Events />
        </section>
        <section id="enroll">
          <EnrollmentCTA />
        </section>
        <Testimonials />
      </main>
      <section id="contact">
        <Footer />
      </section>
    </div>
  );
}

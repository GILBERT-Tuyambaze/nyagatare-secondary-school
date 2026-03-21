import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Events from '@/components/Events';
import EnrollmentCTA from '@/components/EnrollmentCTA';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import Seo from '@/components/Seo';
import SkipNavigation from '@/components/SkipNavigation';

export default function Index() {
  return (
    <div className="min-h-screen">
      <SkipNavigation />
      <Seo
        title="Nyagatare Secondary School | STEM, Academic Excellence, and Admissions in Rwanda"
        description="Nyagatare Secondary School is a Rwandan secondary school focused on academic excellence, STEM education, student discipline, digital school services, and applicant admissions support."
        path="/"
        keywords={[
          'Nyagatare Secondary School Rwanda',
          'secondary school in Nyagatare District',
          'best schools in Rwanda',
          'Nyagatare school',
          'Rwanda secondary school admissions',
          'STEM school in Rwanda',
          'schools in Nyagatare',
          'nsheke school',
          'musheke school',
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'School',
          name: 'Nyagatare Secondary School',
          url: 'https://www.nyagataress.edu.rw/',
          description:
            'Nyagatare Secondary School is a secondary school in Rwanda serving Nyagatare District with strong academics, STEM education, admissions guidance, and digital school services.',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Nyagatare District',
            addressRegion: 'Eastern Province',
            addressCountry: 'RW',
          },
          areaServed: ['Nyagatare District', 'Rwanda'],
          keywords: 'Nyagatare Secondary School, Rwanda secondary school, best schools in Rwanda, Nyagatare school',
        }}
      />
      <Header />
      <main id="main-content" className="pt-20">
        <Hero />
        <section id="about">
          <Features />
        </section>
        <section className="bg-slate-950 py-12 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Academic Focus</p>
              <p className="mt-3 text-2xl font-bold">STEM + General Education</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Learning Model</p>
              <p className="mt-3 text-2xl font-bold">Practical, disciplined, digital</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Admissions</p>
              <p className="mt-3 text-2xl font-bold">Applicant portal now live</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">School Mission</p>
              <p className="mt-3 text-2xl font-bold">Excellence with character</p>
            </div>
          </div>
        </section>
        <section id="academics">
          <div className="bg-stone-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Academic Identity</p>
                <h2 className="mt-4 text-4xl font-bold text-slate-900">A more academic, structured learning environment</h2>
                <p className="mt-4 text-lg text-slate-600">
                  Nyagatare Secondary School blends strong classroom teaching, laboratory practice, student discipline, and digital workflows to support learner success.
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">Science and Mathematics</h3>
                  <p className="mt-3 text-slate-600">Focused instruction in Physics, Chemistry, Biology, and Mathematics with practical support and lab exposure.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">Languages and Communication</h3>
                  <p className="mt-3 text-slate-600">English, Kinyarwanda, and additional language study designed to strengthen communication and academic writing.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">Humanities and Citizenship</h3>
                  <p className="mt-3 text-slate-600">History, Geography, and civic learning that build critical thought, responsibility, and national awareness.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">Digital School Services</h3>
                  <p className="mt-3 text-slate-600">Applicant access, academic workflows, staff operations, and communication are supported through the NSS digital system.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="resources">
          <div className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Campus Life</p>
                <h2 className="mt-4 text-4xl font-bold text-slate-900">Resources that support academic growth</h2>
                <p className="mt-4 text-lg text-slate-600">
                  Our learning environment is shaped by instructional spaces, student support, and facilities that reinforce both scholarship and character.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="rounded-3xl border border-slate-200 bg-stone-50 p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900">Library and Reading Culture</h3>
                  <p className="text-slate-600">A study environment that supports reading, revision, research, and independent learning habits.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-stone-50 p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900">Science Laboratories</h3>
                  <p className="text-slate-600">Practical spaces for experimentation, scientific observation, and concept reinforcement.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-stone-50 p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900">Sports and Student Wellness</h3>
                  <p className="text-slate-600">Physical development, teamwork, and healthy student life remain part of the school experience.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-stone-50 p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-slate-900">Computer and Digital Access</h3>
                  <p className="text-slate-600">Technology access supports digital literacy, school operations, and modern learning expectations.</p>
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

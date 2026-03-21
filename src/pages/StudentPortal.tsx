import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getApplicationByApplicationId } from '@/services/firestoreService'
import { Application } from '@/types/database'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Seo from '@/components/Seo'

const StudentPortal: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [applicationId, setApplicationId] = useState('')
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadApplication = async (nextApplicationId: string) => {
    if (!nextApplicationId.trim()) {
      setApplication(null)
      setError('Please enter your application ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await getApplicationByApplicationId(nextApplicationId.trim())
      if (result) {
        setApplication(result)
      } else {
        setApplication(null)
        setError('Application not found. Please check your application ID and try again.')
      }
    } catch (fetchError) {
      setApplication(null)
      setError('Failed to fetch application. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const queryApplicationId = searchParams.get('applicationId')
    if (queryApplicationId) {
      setApplicationId(queryApplicationId)
      void loadApplication(queryApplicationId)
    }
  }, [searchParams])

  useEffect(() => {
    if (application && (application.status === 'admitted' || application.status === 'rejected')) {
      window.setTimeout(() => {
        document.getElementById('decision-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }, [application?.id, application?.status])

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    await loadApplication(applicationId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'review':
        return <AlertCircle className="h-5 w-5 text-blue-600" />
      case 'admitted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'waitlist':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'review':
        return 'bg-blue-100 text-blue-800'
      case 'admitted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'waitlist':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your application has been received and is awaiting initial review.'
      case 'review':
        return 'Your application is currently under review by our admissions team.'
      case 'admitted':
        return 'Congratulations. A final admission decision has been made. Please review your decision section below.'
      case 'rejected':
        return 'A final admissions decision has been recorded. Please review the decision section below for the school note.'
      case 'waitlist':
        return 'Your application has been placed on our waitlist. We will contact you if a spot becomes available.'
      default:
        return 'Status information is not available.'
    }
  }

  const decisionMessage = application?.decision_notes || application?.admin_notes || ''

  return (
    <>
      <Seo
        title="Applicant Portal | Nyagatare Secondary School"
        description="Track your application, review admissions decisions, and continue applicant onboarding through the Nyagatare Secondary School applicant portal."
        path="/applicant-portal"
        robots="noindex,nofollow"
      />
      <Header />
      <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)] pb-20 pt-32">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-12 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Applicant Portal</p>
            <h1 className="mb-4 mt-4 text-4xl font-bold text-slate-900 md:text-5xl">Applicant Decision Portal</h1>
            <p className="mx-auto max-w-3xl text-lg text-slate-600 md:text-xl">Track your application status and review admissions decisions in a clean, mobile-friendly space.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Track Your Application
              </CardTitle>
              <CardDescription>
                Enter your application ID to view your current status and any decision letter from the admissions office.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    name="applicationId"
                    autoComplete="off"
                    placeholder="e.g., APP-2026-123456"
                    value={applicationId}
                    onChange={(event) => setApplicationId(event.target.value)}
                    className="max-w-md"
                  />
                  <p className="text-sm text-gray-500">
                    Use the application ID you received after submitting your admissions form.
                  </p>
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Track Application'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {application ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Application Details</span>
                  <Badge className={getStatusColor(application.status)}>{application.status.toUpperCase()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4">
                  {getStatusIcon(application.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">Current Status</h3>
                    <p className="text-gray-600">{getStatusMessage(application.status)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-semibold text-gray-900">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {application.first_name} {application.last_name}</div>
                      <div><span className="font-medium">Application ID:</span> {application.application_id}</div>
                      <div><span className="font-medium">Grade Applying For:</span> {application.applying_grade}</div>
                      <div><span className="font-medium">Academic Year:</span> {application.academic_year}</div>
                      <div><span className="font-medium">Previous School:</span> {application.previous_school}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-semibold text-gray-900">Application Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Submitted:</span> {new Date(application.created_at).toLocaleDateString()}</div>
                      {application.reviewed_at ? (
                        <div><span className="font-medium">Last Reviewed:</span> {new Date(application.reviewed_at).toLocaleDateString()}</div>
                      ) : null}
                      {application.reviewed_by ? (
                        <div><span className="font-medium">Reviewed By:</span> {application.reviewed_by}</div>
                      ) : null}
                      {application.score > 0 ? (
                        <div><span className="font-medium">Score:</span> {application.score}%</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {decisionMessage ? (
                  <section id="decision-section" className="scroll-mt-28">
                    <h4 className="mb-2 font-semibold text-gray-900">Decision Section</h4>
                    <div
                      className={`rounded-lg p-4 text-sm ${
                        application.status === 'admitted'
                          ? 'bg-green-50 text-green-900'
                          : application.status === 'rejected'
                            ? 'bg-red-50 text-red-900'
                            : 'bg-blue-50 text-gray-700'
                      }`}
                    >
                      <p className="font-semibold">
                        {application.status === 'admitted'
                          ? 'Congratulations'
                          : application.status === 'rejected'
                            ? 'Decision Notice'
                            : 'Admissions Update'}
                      </p>
                      <p className="mt-2">{decisionMessage}</p>
                    </div>
                  </section>
                ) : null}

                <div className="border-t pt-4">
                  <h4 className="mb-2 font-semibold text-gray-900">What's Next?</h4>
                  <div className="text-sm text-gray-600">
                    {application.status === 'pending' ? (
                      <p>Your application is in the queue for review. We will update the status once our admissions team begins the evaluation process.</p>
                    ) : null}
                    {application.status === 'review' ? (
                      <p>Our admissions team is carefully reviewing your application. This process typically takes 5 to 10 business days.</p>
                    ) : null}
                    {application.status === 'admitted' ? (
                      <div className="space-y-2">
                        <p>Please review your decision section above, then continue with account creation to access the applicant system.</p>
                        {application.applicant_signup_url ? (
                          <a
                            href={application.applicant_signup_url}
                            className="inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            Create Applicant Account
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                    {application.status === 'waitlist' ? (
                      <p>You are currently on the waitlist. Continue checking this portal for updates from the admissions office.</p>
                    ) : null}
                    {application.status === 'rejected' ? (
                      <p>Please review the decision section above. If you need clarification, contact the admissions office using the details below.</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="mb-2 font-semibold text-gray-900">Need Help?</h4>
                  <p className="mb-2 text-sm text-gray-600">
                    If you have questions about your application status, please contact our admissions office:
                  </p>
                  <div className="text-sm text-gray-600">
                    <div>Email: admissions@nyagataress.edu.rw</div>
                    <div>Phone: +250 788 123 456</div>
                    <div>Hours: Monday - Friday, 8:00 AM - 5:00 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default StudentPortal

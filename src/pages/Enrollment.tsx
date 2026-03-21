import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, CheckCircle, Link2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Seo from '@/components/Seo'
import { getApplicationsSettings, submitPublicApplication, subscribeApplicationsSettings } from '@/services/firestoreService'

type ApplicationFormState = {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' | ''
  address: string
  phone: string
  email: string
  guardian_name: string
  guardian_relationship: string
  guardian_phone: string
  guardian_email: string
  guardian_occupation: string
  emergency_contact: string
  urubuto_id: string
  sdms_code: string
  report_link: string
  previous_school: string
  applying_grade: string
  academic_year: string
  preferred_subjects: string
  achievements: string
  motivation: string
}

const initialFormState: ApplicationFormState = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  guardian_name: '',
  guardian_relationship: '',
  guardian_phone: '',
  guardian_email: '',
  guardian_occupation: '',
  emergency_contact: '',
  urubuto_id: '',
  sdms_code: '',
  report_link: '',
  previous_school: '',
  applying_grade: '',
  academic_year: '2026',
  preferred_subjects: '',
  achievements: '',
  motivation: '',
}

const steps = ['Personal Information', 'Guardian Information', 'Academic Background', 'Review & Submit']

const normalizeOptionalUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const candidates = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? [trimmed]
    : [`https://${trimmed}`, trimmed]

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString()
      }
    } catch (error) {
      continue
    }
  }

  throw new Error('Report link must be a valid http or https URL.')
}

export default function Enrollment() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formState, setFormState] = useState<ApplicationFormState>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [applicationsOpen, setApplicationsOpen] = useState(true)
  const [applicationsUpdatedAt, setApplicationsUpdatedAt] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    applicationId: string
    signupUrl?: string
    decisionUrl: string
  } | null>(null)

  const totalSteps = steps.length
  const progress = (currentStep / totalSteps) * 100
  const safeReviewReportLink = (() => {
    try {
      return normalizeOptionalUrl(formState.report_link)
    } catch (error) {
      return ''
    }
  })()

  const updateField = <K extends keyof ApplicationFormState>(field: K, value: ApplicationFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  useEffect(() => {
    getApplicationsSettings().then((settings) => {
      setApplicationsOpen(settings.isOpen)
      setApplicationsUpdatedAt(settings.updated_at)
    })

    const unsubscribe = subscribeApplicationsSettings((settings) => {
      setApplicationsOpen(settings.isOpen)
      setApplicationsUpdatedAt(settings.updated_at)
    })

    return unsubscribe
  }, [])

  const stepErrors = useMemo(() => {
    if (currentStep === 1) {
      return !formState.first_name || !formState.last_name || !formState.date_of_birth || !formState.gender || !formState.address || !formState.email
    }
    if (currentStep === 2) {
      return !formState.guardian_name || !formState.guardian_relationship || !formState.guardian_phone
    }
    if (currentStep === 3) {
      return !formState.previous_school || !formState.applying_grade || !formState.academic_year || !formState.motivation
    }
    return false
  }, [currentStep, formState])

  const nextStep = () => {
    if (currentStep === 3) {
      try {
        const normalizedReportLink = normalizeOptionalUrl(formState.report_link)
        if (normalizedReportLink !== formState.report_link) {
          updateField('report_link', normalizedReportLink)
        }
      } catch (validationError) {
        setError(validationError instanceof Error ? validationError.message : 'Please provide a valid report link.')
        return
      }
    }

    if (currentStep < totalSteps && !stepErrors) {
      setCurrentStep((current) => current + 1)
      setError('')
      return
    }

    if (stepErrors) {
      setError('Please complete the required fields before continuing.')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((current) => current - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!applicationsOpen) {
      setError('Applications are currently closed. Please try again later.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const normalizedReportLink = normalizeOptionalUrl(formState.report_link)

      const application = await submitPublicApplication({
        origin: window.location.origin,
        application: {
          ...formState,
          report_link: normalizedReportLink,
          gender: formState.gender || 'other',
          status: 'pending',
          score: 0,
          admin_notes: '',
        },
      })

      setSuccess({
        applicationId: application.application_id,
        signupUrl: application.applicant_signup_url,
        decisionUrl: `${window.location.origin}/applicant-portal?applicationId=${encodeURIComponent(application.application_id)}`,
      })

      if (application.applicant_signup_url) {
        setTimeout(() => {
          window.location.assign(application.applicant_signup_url as string)
        }, 3000)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <Seo
          title="Application Submitted | Nyagatare Secondary School Admissions"
          description="Your Nyagatare Secondary School application has been submitted. Review your application ID, applicant portal, and account creation next steps."
          path="/enroll"
        />
        <Header />
        <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)] pb-20 pt-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  Application Submitted Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-gray-700">
                  Your application has been saved. Your application ID is <span className="font-semibold">{success.applicationId}</span>.
                </p>
                <p className="text-gray-700">
                  You can also review your application any time through the decision portal using your saved application ID.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Applicant decision portal</p>
                  <p className="mt-2 break-all text-sm text-slate-700">{success.decisionUrl}</p>
                </div>
                <Button variant="outline" asChild>
                  <a href={success.decisionUrl}>
                    Open Decision Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                {success.signupUrl ? (
                  <>
                    <p className="text-gray-700">
                      You can now create your applicant account using the one-time secure link below. You will be redirected automatically in a few seconds.
                    </p>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="break-all text-sm text-gray-700">{success.signupUrl}</p>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                      <a href={success.signupUrl}>
                        Create Applicant Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-700">
                    No applicant email was available for automatic account setup. Please contact admissions to complete onboarding.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Seo
        title="Admissions Application | Nyagatare Secondary School"
        description="Apply to Nyagatare Secondary School through the online admissions form, submit applicant details, and begin your applicant portal access."
        path="/enroll"
        keywords={[
          'Nyagatare Secondary School admissions',
          'apply to school in Rwanda',
          'secondary school admissions Rwanda',
          'Nyagatare District school admissions',
          'Rwanda STEM school application',
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Nyagatare Secondary School Admissions',
          url: 'https://www.nyagataress.edu.rw/enroll',
          about: {
            '@type': 'School',
            name: 'Nyagatare Secondary School',
          },
        }}
      />
      <Header />
      <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)] pb-20 pt-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {!applicationsOpen ? (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <p className="text-lg font-semibold text-gray-900">Applications are currently closed.</p>
                <p className="mt-2 text-sm text-gray-700">
                  Admissions intake has been paused by school leadership. Please check back later or contact the admissions office.
                </p>
                {applicationsUpdatedAt ? (
                  <p className="mt-2 text-xs text-gray-500">Last updated {new Date(applicationsUpdatedAt).toLocaleString()}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Admissions</p>
            <h1 className="mb-4 mt-4 text-4xl font-bold text-slate-900 md:text-5xl">Student Enrollment Application</h1>
            <p className="mx-auto max-w-3xl text-lg text-slate-600 md:text-xl">Join Nyagatare Secondary School and start your admissions journey through a secure digital application process.</p>
          </div>

          <Card className="mb-8 border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex justify-between">
                <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
                <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="mb-4" />
              <div className="flex justify-between gap-2 text-xs text-gray-500 md:text-sm">
                {steps.map((step, index) => (
                  <span key={step} className={index + 1 <= currentStep ? 'font-medium text-orange-600' : ''}>
                    {step}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>{steps[currentStep - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

              {currentStep === 1 ? (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" autoComplete="given-name" value={formState.first_name} onChange={(event) => updateField('first_name', event.target.value)} placeholder="Enter your first name" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" autoComplete="family-name" value={formState.last_name} onChange={(event) => updateField('last_name', event.target.value)} placeholder="Enter your last name" />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" value={formState.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formState.gender} onValueChange={(value: 'male' | 'female' | 'other') => updateField('gender', value)}>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Home Address *</Label>
                    <Textarea id="address" name="address" autoComplete="street-address" value={formState.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Enter your full address" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" autoComplete="tel" value={formState.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+250 XXX XXX XXX" />
                    </div>
                    <div>
                      <Label htmlFor="email">Applicant Email *</Label>
                      <Input id="email" name="email" type="email" autoComplete="email" value={formState.email} onChange={(event) => updateField('email', event.target.value)} placeholder="student@email.com" />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="guardianName">Guardian Full Name *</Label>
                      <Input id="guardianName" name="guardianName" autoComplete="name" value={formState.guardian_name} onChange={(event) => updateField('guardian_name', event.target.value)} placeholder="Enter guardian's full name" />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Select value={formState.guardian_relationship} onValueChange={(value) => updateField('guardian_relationship', value)}>
                        <SelectTrigger id="relationship">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Legal Guardian</SelectItem>
                          <SelectItem value="relative">Relative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                      <Input id="guardianPhone" name="guardianPhone" autoComplete="tel" value={formState.guardian_phone} onChange={(event) => updateField('guardian_phone', event.target.value)} placeholder="+250 XXX XXX XXX" />
                    </div>
                    <div>
                      <Label htmlFor="guardianEmail">Guardian Email</Label>
                      <Input id="guardianEmail" name="guardianEmail" type="email" autoComplete="email" value={formState.guardian_email} onChange={(event) => updateField('guardian_email', event.target.value)} placeholder="guardian@email.com" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Guardian Occupation</Label>
                    <Input id="occupation" name="guardianOccupation" autoComplete="organization-title" value={formState.guardian_occupation} onChange={(event) => updateField('guardian_occupation', event.target.value)} placeholder="Enter occupation" />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                    <Input id="emergencyContact" name="emergencyContact" autoComplete="off" value={formState.emergency_contact} onChange={(event) => updateField('emergency_contact', event.target.value)} placeholder="Name and phone number" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="urubutoId">Urubuto ID</Label>
                      <Input id="urubutoId" name="urubutoId" autoComplete="off" value={formState.urubuto_id} onChange={(event) => updateField('urubuto_id', event.target.value)} placeholder="Optional Urubuto identifier" />
                    </div>
                    <div>
                      <Label htmlFor="sdmsCode">SDMS Code</Label>
                      <Input id="sdmsCode" name="sdmsCode" autoComplete="off" value={formState.sdms_code} onChange={(event) => updateField('sdms_code', event.target.value)} placeholder="Optional SDMS code" />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="previousSchool">Previous School *</Label>
                    <Input id="previousSchool" name="previousSchool" autoComplete="organization" value={formState.previous_school} onChange={(event) => updateField('previous_school', event.target.value)} placeholder="Name of your previous school" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="gradeLevel">Applying for Grade *</Label>
                      <Select value={formState.applying_grade} onValueChange={(value) => updateField('applying_grade', value)}>
                        <SelectTrigger id="gradeLevel">
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grade 7 (S1)">Grade 7 (S1)</SelectItem>
                          <SelectItem value="Grade 8 (S2)">Grade 8 (S2)</SelectItem>
                          <SelectItem value="Grade 9 (S3)">Grade 9 (S3)</SelectItem>
                          <SelectItem value="Grade 10 (S4)">Grade 10 (S4)</SelectItem>
                          <SelectItem value="Grade 11 (S5)">Grade 11 (S5)</SelectItem>
                          <SelectItem value="Grade 12 (S6)">Grade 12 (S6)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Select value={formState.academic_year} onValueChange={(value) => updateField('academic_year', value)}>
                        <SelectTrigger id="academicYear">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2026">2026</SelectItem>
                          <SelectItem value="2027">2027</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subjects">Preferred STEM Subjects</Label>
                    <Textarea id="subjects" name="preferredSubjects" autoComplete="off" value={formState.preferred_subjects} onChange={(event) => updateField('preferred_subjects', event.target.value)} placeholder="List your preferred science, technology, engineering, or math subjects" />
                  </div>

                  <div>
                    <Label htmlFor="achievements">Academic Achievements & Awards</Label>
                    <Textarea id="achievements" name="achievements" autoComplete="off" value={formState.achievements} onChange={(event) => updateField('achievements', event.target.value)} placeholder="Describe academic achievements, awards, or recognitions" />
                  </div>

                  <div>
                    <Label htmlFor="reportLink">Report Link</Label>
                    <Input id="reportLink" name="reportLink" autoComplete="url" value={formState.report_link} onChange={(event) => updateField('report_link', event.target.value)} placeholder="Optional link to your school report or academic file" />
                    <p className="mt-1 text-xs text-gray-500">
                      Paste a shareable `http` or `https` link to a report card, Google Drive file, OneDrive file, Dropbox file, or other academic document.
                    </p>
                  </div>

                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Use a shareable document link</p>
                        <p className="mt-1 text-xs text-gray-600">
                          Firebase Storage asks for billing, so this application form now works with report links only. Make sure the link can be opened by the admissions team.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="motivation">Why do you want to join NSS? *</Label>
                    <Textarea id="motivation" name="motivation" autoComplete="off" value={formState.motivation} onChange={(event) => updateField('motivation', event.target.value)} placeholder="Tell us why you're interested in our school and programs" />
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <h3 className="text-lg font-semibold text-gray-900">Review Your Application</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Your information will be saved to the admissions database and reviewed by Admin, Headmaster, DOS, and Admissions Office members.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border bg-white p-4">
                      <p className="font-semibold text-gray-900">Applicant</p>
                      <p className="mt-2 text-sm text-gray-600">{formState.first_name} {formState.last_name}</p>
                      <p className="text-sm text-gray-600">{formState.email}</p>
                      <p className="text-sm text-gray-600">{formState.phone || 'No phone provided'}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4">
                      <p className="font-semibold text-gray-900">Admissions Target</p>
                      <p className="mt-2 text-sm text-gray-600">{formState.applying_grade}</p>
                      <p className="text-sm text-gray-600">Academic year {formState.academic_year}</p>
                      <p className="text-sm text-gray-600">Previous school: {formState.previous_school}</p>
                      <p className="text-sm text-gray-600">Urubuto ID: {formState.urubuto_id || 'Not provided'}</p>
                      <p className="text-sm text-gray-600">SDMS code: {formState.sdms_code || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="font-semibold text-gray-900">Motivation</p>
                    <p className="mt-2 text-sm text-gray-600">{formState.motivation}</p>
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Report link:</span>{' '}
                      {safeReviewReportLink ? (
                        <a
                          href={safeReviewReportLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
                        >
                          Open submitted report
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || submitting}>
                  Previous
                </Button>

                <div className="space-x-4">
                  {currentStep < totalSteps ? (
                    <Button onClick={nextStep} className="bg-orange-500 hover:bg-orange-600" disabled={submitting || !applicationsOpen}>
                      Continue
                    </Button>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700" disabled={submitting || !applicationsOpen} onClick={handleSubmit}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-gray-500">
            Need help? Contact our admissions office at +250 788 123 456 or admissions@nyagataress.edu.rw
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

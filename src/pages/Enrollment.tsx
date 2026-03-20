import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createApplicantInvite, createApplication, getApplicationsSettings, updateApplication } from '@/services/firestoreService'

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
  previous_school: '',
  applying_grade: '',
  academic_year: '2026',
  preferred_subjects: '',
  achievements: '',
  motivation: '',
}

const steps = ['Personal Information', 'Guardian Information', 'Academic Background', 'Review & Submit']

export default function Enrollment() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formState, setFormState] = useState<ApplicationFormState>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [applicationsOpen, setApplicationsOpen] = useState(true)
  const [success, setSuccess] = useState<{
    applicationId: string
    signupUrl?: string
  } | null>(null)

  const totalSteps = steps.length
  const progress = (currentStep / totalSteps) * 100

  const updateField = <K extends keyof ApplicationFormState>(field: K, value: ApplicationFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  useEffect(() => {
    getApplicationsSettings().then((settings) => setApplicationsOpen(settings.isOpen))
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
      const application = await createApplication({
        ...formState,
        gender: formState.gender || 'other',
        status: 'pending',
        score: 0,
        admin_notes: '',
      })

      let applicantInviteUrl = ''
      let applicantInviteId = ''

      if (formState.email.trim()) {
        const invite = await createApplicantInvite({
          applicationId: application.application_id,
          email: formState.email.trim().toLowerCase(),
          origin: window.location.origin,
        })

        applicantInviteUrl = invite.signupUrl || ''
        applicantInviteId = invite.id

        await updateApplication(application.id, {
          applicant_invite_id: applicantInviteId,
          applicant_signup_url: applicantInviteUrl,
        })
      }

      setSuccess({
        applicationId: application.application_id,
        signupUrl: applicantInviteUrl,
      })

      if (applicantInviteUrl) {
        setTimeout(() => {
          window.location.assign(applicantInviteUrl)
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
        <Header />
        <div className="min-h-screen bg-gray-50 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card>
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
                {success.signupUrl ? (
                  <>
                    <p className="text-gray-700">
                      You can now create your applicant account using the link below. You will be redirected automatically in a few seconds.
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
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {!applicationsOpen ? (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <p className="text-lg font-semibold text-gray-900">Applications are currently closed.</p>
                <p className="mt-2 text-sm text-gray-700">
                  Admissions intake has been paused by school leadership. Please check back later or contact the admissions office.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">Student Enrollment Application</h1>
            <p className="text-xl text-gray-600">Join Nyagatare Secondary School and start your admissions journey.</p>
          </div>

          <Card className="mb-8">
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

          <Card>
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
                      <Input id="firstName" value={formState.first_name} onChange={(event) => updateField('first_name', event.target.value)} placeholder="Enter your first name" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" value={formState.last_name} onChange={(event) => updateField('last_name', event.target.value)} placeholder="Enter your last name" />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" type="date" value={formState.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formState.gender} onValueChange={(value: 'male' | 'female' | 'other') => updateField('gender', value)}>
                        <SelectTrigger>
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
                    <Textarea id="address" value={formState.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Enter your full address" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={formState.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+250 XXX XXX XXX" />
                    </div>
                    <div>
                      <Label htmlFor="email">Applicant Email *</Label>
                      <Input id="email" type="email" value={formState.email} onChange={(event) => updateField('email', event.target.value)} placeholder="student@email.com" />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="guardianName">Guardian Full Name *</Label>
                      <Input id="guardianName" value={formState.guardian_name} onChange={(event) => updateField('guardian_name', event.target.value)} placeholder="Enter guardian's full name" />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Select value={formState.guardian_relationship} onValueChange={(value) => updateField('guardian_relationship', value)}>
                        <SelectTrigger>
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
                      <Input id="guardianPhone" value={formState.guardian_phone} onChange={(event) => updateField('guardian_phone', event.target.value)} placeholder="+250 XXX XXX XXX" />
                    </div>
                    <div>
                      <Label htmlFor="guardianEmail">Guardian Email</Label>
                      <Input id="guardianEmail" type="email" value={formState.guardian_email} onChange={(event) => updateField('guardian_email', event.target.value)} placeholder="guardian@email.com" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Guardian Occupation</Label>
                    <Input id="occupation" value={formState.guardian_occupation} onChange={(event) => updateField('guardian_occupation', event.target.value)} placeholder="Enter occupation" />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                    <Input id="emergencyContact" value={formState.emergency_contact} onChange={(event) => updateField('emergency_contact', event.target.value)} placeholder="Name and phone number" />
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="previousSchool">Previous School *</Label>
                    <Input id="previousSchool" value={formState.previous_school} onChange={(event) => updateField('previous_school', event.target.value)} placeholder="Name of your previous school" />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="gradeLevel">Applying for Grade *</Label>
                      <Select value={formState.applying_grade} onValueChange={(value) => updateField('applying_grade', value)}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                    <Textarea id="subjects" value={formState.preferred_subjects} onChange={(event) => updateField('preferred_subjects', event.target.value)} placeholder="List your preferred science, technology, engineering, or math subjects" />
                  </div>

                  <div>
                    <Label htmlFor="achievements">Academic Achievements & Awards</Label>
                    <Textarea id="achievements" value={formState.achievements} onChange={(event) => updateField('achievements', event.target.value)} placeholder="Describe academic achievements, awards, or recognitions" />
                  </div>

                  <div>
                    <Label htmlFor="motivation">Why do you want to join NSS? *</Label>
                    <Textarea id="motivation" value={formState.motivation} onChange={(event) => updateField('motivation', event.target.value)} placeholder="Tell us why you're interested in our school and programs" />
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
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="font-semibold text-gray-900">Motivation</p>
                    <p className="mt-2 text-sm text-gray-600">{formState.motivation}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || submitting}>
                  Previous
                </Button>

                <div className="space-x-4">
                  {currentStep < totalSteps ? (
                    <Button onClick={nextStep} className="bg-orange-500 hover:bg-orange-600" disabled={submitting}>
                      Continue
                    </Button>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700" disabled={submitting} onClick={handleSubmit}>
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
      </div>
      <Footer />
    </>
  )
}

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getApplicationByApplicationId } from '@/services/supabaseService'
import { Application } from '@/types/database'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const StudentPortal: React.FC = () => {
  const [applicationId, setApplicationId] = useState('')
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicationId.trim()) {
      setError('Please enter your application ID')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await getApplicationByApplicationId(applicationId.trim())
      if (result) {
        setApplication(result)
      } else {
        setError('Application not found. Please check your application ID and try again.')
      }
    } catch (err) {
      setError('Failed to fetch application. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'review':
        return <AlertCircle className="w-5 h-5 text-blue-600" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'waitlist':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
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
      case 'approved':
        return 'Congratulations! Your application has been approved. You will receive further instructions via email.'
      case 'rejected':
        return 'Unfortunately, your application was not successful this time. You may reapply next academic year.'
      case 'waitlist':
        return 'Your application has been placed on our waitlist. We will contact you if a spot becomes available.'
      default:
        return 'Status information is not available.'
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Student Application Portal
            </h1>
            <p className="text-xl text-gray-600">
              Track your enrollment application status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Track Your Application
              </CardTitle>
              <CardDescription>
                Enter your application ID to view the current status of your enrollment application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    placeholder="e.g., APP-2025-001"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    className="max-w-md"
                  />
                  <p className="text-sm text-gray-500">
                    Your application ID was provided when you submitted your enrollment application.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Track Application'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Application Details */}
          {application && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Application Details</span>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Section */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  {getStatusIcon(application.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">Current Status</h3>
                    <p className="text-gray-600">{getStatusMessage(application.status)}</p>
                  </div>
                </div>

                {/* Application Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {application.first_name} {application.last_name}</div>
                      <div><span className="font-medium">Application ID:</span> {application.application_id}</div>
                      <div><span className="font-medium">Grade Applying For:</span> {application.applying_grade}</div>
                      <div><span className="font-medium">Academic Year:</span> {application.academic_year}</div>
                      <div><span className="font-medium">Previous School:</span> {application.previous_school}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Application Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Submitted:</span> {new Date(application.created_at).toLocaleDateString()}</div>
                      {application.reviewed_at && (
                        <div><span className="font-medium">Last Reviewed:</span> {new Date(application.reviewed_at).toLocaleDateString()}</div>
                      )}
                      {application.score > 0 && (
                        <div><span className="font-medium">Score:</span> {application.score}%</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {application.admin_notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                    <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                      {application.admin_notes}
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                  <div className="text-sm text-gray-600">
                    {application.status === 'pending' && (
                      <p>Your application is in the queue for review. We will update the status once our admissions team begins the evaluation process.</p>
                    )}
                    {application.status === 'review' && (
                      <p>Our admissions team is carefully reviewing your application. This process typically takes 5-10 business days.</p>
                    )}
                    {application.status === 'approved' && (
                      <p>Please check your email for enrollment instructions and required documents. Contact us if you haven't received the email within 24 hours.</p>
                    )}
                    {application.status === 'waitlist' && (
                      <p>You're on our waitlist. We'll contact you immediately if a spot becomes available. Continue to check this portal for updates.</p>
                    )}
                    {application.status === 'rejected' && (
                      <p>We encourage you to reapply next academic year. Consider strengthening your application with additional achievements or improved grades.</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If you have questions about your application status, please contact our admissions office:
                  </p>
                  <div className="text-sm text-gray-600">
                    <div>📧 admissions@nyagataress.edu.rw</div>
                    <div>📞 +250 788 123 456</div>
                    <div>🕒 Monday - Friday, 8:00 AM - 5:00 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default StudentPortal
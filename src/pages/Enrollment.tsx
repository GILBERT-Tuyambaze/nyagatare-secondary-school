import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle } from 'lucide-react';
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const Enrollment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    'Personal Information',
    'Guardian Information', 
    'Academic Background',
    'Document Upload'
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
   <> 
    <Header />
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student Enrollment Application
          </h1>
          <p className="text-xl text-gray-600">
            Join Nyagatare Secondary School - Excellence in STEM Education
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="flex justify-between text-sm text-gray-500">
              {steps.map((step, index) => (
                <span 
                  key={index}
                  className={`${index + 1 <= currentStep ? 'text-orange-600 font-medium' : ''}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep <= totalSteps && <CheckCircle className="w-5 h-5 text-green-500" />}
              <span>{steps[currentStep - 1]}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select>
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
                  <Textarea id="address" placeholder="Enter your full address" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+250 XXX XXX XXX" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="student@email.com" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Guardian Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="guardianName">Guardian Full Name *</Label>
                    <Input id="guardianName" placeholder="Enter guardian's full name" />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                    <Input id="guardianPhone" placeholder="+250 XXX XXX XXX" />
                  </div>
                  <div>
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input id="guardianEmail" type="email" placeholder="guardian@email.com" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="occupation">Guardian Occupation</Label>
                  <Input id="occupation" placeholder="Enter occupation" />
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name & Phone *</Label>
                  <Input id="emergencyContact" placeholder="Name and phone number" />
                </div>
              </div>
            )}

            {/* Step 3: Academic Background */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="previousSchool">Previous School *</Label>
                  <Input id="previousSchool" placeholder="Name of your previous school" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gradeLevel">Applying for Grade *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Grade 7 (S1)</SelectItem>
                        <SelectItem value="8">Grade 8 (S2)</SelectItem>
                        <SelectItem value="9">Grade 9 (S3)</SelectItem>
                        <SelectItem value="10">Grade 10 (S4)</SelectItem>
                        <SelectItem value="11">Grade 11 (S5)</SelectItem>
                        <SelectItem value="12">Grade 12 (S6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="academicYear">Academic Year *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subjects">Preferred STEM Subjects</Label>
                  <Textarea 
                    id="subjects" 
                    placeholder="List your preferred science, technology, engineering, or math subjects"
                  />
                </div>

                <div>
                  <Label htmlFor="achievements">Academic Achievements & Awards</Label>
                  <Textarea 
                    id="achievements" 
                    placeholder="Describe any academic achievements, awards, or special recognitions"
                  />
                </div>

                <div>
                  <Label htmlFor="motivation">Why do you want to join NSS? *</Label>
                  <Textarea 
                    id="motivation" 
                    placeholder="Tell us why you're interested in our STEM programs"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-sm text-gray-600 mb-4">
                  Please upload the following required documents:
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Student Passport Photo *
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      PNG, JPG up to 2MB
                    </div>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Birth Certificate *
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      PDF, PNG, JPG up to 5MB
                    </div>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Previous School Report *
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      PDF up to 10MB
                    </div>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Additional Documents
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      Optional: Awards, certificates, etc.
                    </div>
                    <Button variant="outline" size="sm">
                      Choose Files
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="space-x-4">
                <Button variant="outline">
                  Save & Resume Later
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button 
                    onClick={nextStep}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button className="bg-green-600 hover:bg-green-700">
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact our admissions office at +250 788 123 456 or admissions@nyagataress.edu.rw</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Enrollment;
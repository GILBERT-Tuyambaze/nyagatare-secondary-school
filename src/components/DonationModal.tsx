import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Heart, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const predefinedAmounts = [25000, 50000, 100000, 250000]; // RWF amounts

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 1000) {
      toast.error('Please enter a valid donation amount (minimum 1,000 RWF)');
      return;
    }

    if (!donationType) {
      toast.error('Please select a donation type');
      return;
    }

    if (!isAnonymous && (!donorName || !donorEmail)) {
      toast.error('Please provide your name and email, or choose to donate anonymously');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Thank you for your generous donation!');
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        setAmount('');
        setDonationType('');
        setDonorName('');
        setDonorEmail('');
        setMessage('');
        setIsAnonymous(false);
        onOpenChange(false);
      }, 3000);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-4">
              Your donation of {parseFloat(amount).toLocaleString()} RWF has been received.
            </p>
            <p className="text-sm text-gray-500">
              You will receive a confirmation email shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Support Our STEM Future</span>
          </DialogTitle>
          <DialogDescription>
            Your contribution helps fund laboratories, equipment, and scholarships for deserving students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDonate} className="space-y-6">
          {/* Donation Amount */}
          <div>
            <Label htmlFor="amount">Donation Amount (RWF) *</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {predefinedAmounts.map((preAmount) => (
                <Button
                  key={preAmount}
                  type="button"
                  variant={amount === preAmount.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preAmount.toString())}
                  className="text-sm"
                >
                  {preAmount.toLocaleString()} RWF
                </Button>
              ))}
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              className="focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum donation: 1,000 RWF</p>
          </div>

          {/* Donation Type */}
          <div>
            <Label htmlFor="donationType">Donation Purpose *</Label>
            <Select value={donationType} onValueChange={setDonationType}>
              <SelectTrigger className="focus:ring-2 focus:ring-orange-500">
                <SelectValue placeholder="Select donation purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Support</SelectItem>
                <SelectItem value="scholarship">Student Scholarships</SelectItem>
                <SelectItem value="equipment">Laboratory Equipment</SelectItem>
                <SelectItem value="infrastructure">Infrastructure Development</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <Label htmlFor="anonymous" className="text-sm">
              I prefer to donate anonymously
            </Label>
          </div>

          {/* Donor Information */}
          {!isAnonymous && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="donorName">Full Name *</Label>
                <Input
                  id="donorName"
                  placeholder="Enter your full name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="donorEmail">Email Address *</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Leave a message of support..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-300"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Donate Now
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 text-center mt-4">
          <p>Your donation is secure and helps support STEM education at Nyagatare Secondary School.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
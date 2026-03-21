import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Heart, CreditCard, Loader2, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createDonation, uploadDonationReceipt } from '@/services/firestoreService';
import { Donation } from '@/types/database';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [amount, setAmount] = useState('');
  const [donationType, setDonationType] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedDonationAmount, setSavedDonationAmount] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const resetForm = () => {
    setAmount('');
    setDonationType('');
    setDonorName('');
    setDonorEmail('');
    setDonorPhone('');
    setPaymentMethod('');
    setPaymentReference('');
    setMessage('');
    setIsAnonymous(false);
    setSavedDonationAmount('');
    setReceiptFile(null);
    setCheckoutUrl('');
  };

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

    if (donorEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(donorEmail.trim().toLowerCase())) {
        toast.error('Please provide a valid email address');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const donationBase: Omit<Donation, 'id' | 'created_at' | 'updated_at'> = {
        donor_name: isAnonymous ? 'Anonymous donor' : donorName.trim(),
        donor_email: isAnonymous ? undefined : donorEmail.trim().toLowerCase(),
        donor_phone: donorPhone.trim() || undefined,
        amount: Number(amount),
        currency: 'RWF',
        donation_type: donationType as Donation['donation_type'],
        payment_method: paymentMethod || undefined,
        payment_provider:
          paymentMethod === 'flutterwave'
            ? 'flutterwave'
            : paymentMethod === 'bank_transfer'
              ? 'bank_transfer'
              : paymentMethod === 'cash'
                ? 'cash'
                : paymentMethod
                  ? 'other'
                  : undefined,
        payment_status: 'pending',
        payment_reference: paymentReference.trim() || undefined,
        message: message.trim() || undefined,
        is_anonymous: isAnonymous,
      };

      // upload receipt for bank transfer if provided
      let receiptUrl: string | undefined
      let receiptPath: string | undefined
      if (paymentMethod === 'bank_transfer' && receiptFile) {
        const uploaded = await uploadDonationReceipt(receiptFile)
        receiptUrl = uploaded.downloadUrl
        receiptPath = uploaded.storagePath
      }

      const saved = await createDonation({
        ...donationBase,
        receipt_url: receiptUrl,
        receipt_path: receiptPath,
      });

      if (paymentMethod === 'flutterwave') {
        const response = await fetch('/api/donations-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(amount),
            currency: 'RWF',
            email: isAnonymous ? undefined : donorEmail.trim().toLowerCase(),
            name: isAnonymous ? 'Anonymous donor' : donorName.trim(),
            donationId: saved.id,
            donationType,
          }),
        });

        if (!response.ok) {
          throw new Error('Could not start payment');
        }

        const result = await response.json();
        const link = result?.data?.link;
        if (!link) {
          throw new Error('Payment link missing');
        }

        setCheckoutUrl(link);
        window.location.href = link;
      } else {
        setSavedDonationAmount(amount);
        setIsSuccess(true);
        toast.success('Your donation has been recorded. Please complete payment using the reference provided.');
        setTimeout(() => {
          setIsSuccess(false);
          resetForm();
          onOpenChange(false);
        }, 3000);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to submit donation:', error);
      setIsProcessing(false);
      toast.error('We could not record your donation right now. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-4">
              Your donation request of {parseFloat(savedDonationAmount || amount).toLocaleString()} RWF has been recorded.
            </p>
            <p className="text-sm text-gray-500">
              Our finance team can now review and confirm it in the NSS system.
            </p>
            {checkoutUrl ? (
              <p className="mt-3 text-sm text-gray-500 flex items-center justify-center gap-2">
                <LinkIcon className="h-4 w-4" /> If you were not redirected,{' '}
                <a className="text-orange-600 underline" href={checkoutUrl}>open your payment link</a>.
              </p>
            ) : null}
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
            Your contribution helps fund laboratories, equipment, scholarships, and future-ready learning for Nyagatare Secondary School students.
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="donorPhone">Phone Number</Label>
              <Input
                id="donorPhone"
                placeholder="Enter your phone number"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                className="focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="focus:ring-2 focus:ring-orange-500">
                  <SelectValue placeholder="Choose a method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flutterwave">Mobile Money / Card (Flutterwave)</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer (enter reference)</SelectItem>
                  <SelectItem value="cash">Cash / Pledge</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentReference">Payment Reference</Label>
            <Input
              id="paymentReference"
              placeholder="Transaction code, receipt number, or pledge reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {paymentMethod === 'bank_transfer' ? (
            <div>
              <Label htmlFor="receiptUpload">Upload Receipt (optional, PDF/JPG/PNG)</Label>
              <Input
                id="receiptUpload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">If you already paid by bank transfer, attach the receipt to speed up confirmation.</p>
            </div>
          ) : null}

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
          <p>Your donation record is saved securely and reviewed through the NSS finance workflow.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

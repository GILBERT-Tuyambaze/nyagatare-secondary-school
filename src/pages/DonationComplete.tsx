import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from '@/loginpage/components/Card'

export default function DonationCompletePage() {
  const search = useSearchParams()[0]
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'refunded'>('pending')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const txRef = search.get('tx_ref')
    const transactionId = search.get('transaction_id')

    const verify = async () => {
      try {
        const res = await fetch('/api/donations-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Verify failed')

        setStatus(data.status || 'pending')
        setMessage(
          data.status === 'completed'
            ? 'Thank you! Your payment is confirmed.'
            : data.status === 'failed'
              ? 'Payment failed. Please try again or use a different method.'
              : 'Payment is pending. We will confirm once the provider finalizes it.'
        )
      } catch (error) {
        setStatus('pending')
        setMessage('We could not verify the payment. Please contact finance with your reference.')
      }
    }

    if (txRef && transactionId) {
      void verify()
    } else {
      setMessage('Missing payment reference. Please contact finance.')
    }
  }, [search])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card title="Donation Payment" description="Status of your recent donation">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Status: {status}</p>
          <p className="text-slate-300">{message}</p>
          <button
            className="mt-3 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { markPaid } from '@/app/(main)/match-payments/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRef } from 'react'

export function PaymentForm({ matchId }: { matchId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await markPaid(matchId, formData)
    if (result?.success) {
      toast.success(result.message)
      formRef.current?.reset()
    } else {
      toast.error(result?.message || 'Failed to submit payment')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input 
                name="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Reference (Optional)</Label>
              <Input 
                name="reference" 
                placeholder="Transaction ID, note, etc." 
              />
            </div>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-lg text-sm text-emerald-800 border border-emerald-100">
            <strong>Payment Instructions:</strong> Submit your payment amount and any reference information. 
            Your payment will be reviewed and confirmed by an administrator.
          </div>
          
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Submit Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

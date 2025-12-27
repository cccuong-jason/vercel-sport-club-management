'use client'

import { confirmPayment, rejectPayment } from '@/app/(main)/match-payments/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'

interface Props {
  matchId: string
  user: { _id: string; name: string }
  payment: any
  isAdmin: boolean
  isCurrentUser: boolean
}

export function PaymentRow({ matchId, user, payment, isAdmin, isCurrentUser }: Props) {
  const status = payment?.status || 'not-submitted'
  const amount = payment?.amount || 0
  const [adminNote, setAdminNote] = useState('')

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const handleConfirm = async () => {
    const fd = new FormData()
    fd.append('userId', user._id)
    fd.append('amount', String(amount))
    fd.append('adminNote', adminNote)
    
    const result = await confirmPayment(matchId, fd)
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Failed to confirm payment')
    }
  }

  const handleReject = async () => {
    const fd = new FormData()
    fd.append('userId', user._id)
    fd.append('adminNote', adminNote)
    
    const result = await rejectPayment(matchId, fd)
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Failed to reject payment')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
          {user.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium flex items-center gap-2">
            {user.name}
            {isCurrentUser && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">You</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {payment?.reference || 'No reference provided'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </div>
          {amount > 0 && (
            <div className="text-sm font-bold mt-1">
              ${amount.toFixed(2)}
            </div>
          )}
        </div>
        
        {isAdmin && status === 'pending' && (
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Admin note" 
              className="h-8 w-32"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
            <Button size="sm" onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700 h-8 w-8 p-0">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={handleReject} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

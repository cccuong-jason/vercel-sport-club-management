'use client'

import { claimAdmin } from '@/app/(main)/team/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { Crown } from 'lucide-react'

export function ClaimAdminButton() {
  const handleSubmit = async () => {
    const result = await claimAdmin()
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Nhận quyền quản lý thất bại')
    }
  }

  return (
    <form action={handleSubmit}>
      <Button 
        type="submit" 
        variant="outline"
        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-none hover:opacity-90 hover:text-white"
      >
        <Crown className="mr-2 h-4 w-4" /> Nhận quyền quản lý
      </Button>
    </form>
  )
}

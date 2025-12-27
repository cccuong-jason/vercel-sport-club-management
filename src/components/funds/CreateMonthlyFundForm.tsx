'use client'

import { createMonthlyFund } from '@/app/(main)/funds/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function CreateMonthlyFundForm() {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await createMonthlyFund(formData)
    if (result?.success) {
      toast.success(result.message)
      setOpen(false)
    } else {
      toast.error(result?.message || 'Tạo quỹ thất bại')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Tạo quỹ tháng mới</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo quỹ hàng tháng</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input name="title" placeholder="VD: Quỹ tháng 10/2023" required />
          </div>
          <div className="space-y-2">
            <Label>Số tiền mỗi thành viên ($)</Label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label>Hạn nộp</Label>
            <Input name="dueDate" type="date" required />
          </div>
          <Button type="submit" className="w-full">Tạo & Gán cho tất cả</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

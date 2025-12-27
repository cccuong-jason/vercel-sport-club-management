'use client'

import { assignPenalty } from '@/app/(main)/funds/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

export function AssignPenaltyForm({ members }: { members: any[] }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await assignPenalty(formData)
    if (result?.success) {
      toast.success(result.message)
      setOpen(false)
    } else {
      toast.error(result?.message || 'Gán phạt thất bại')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive"><AlertTriangle className="mr-2 h-4 w-4" /> Gán phạt</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán phí phạt</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Thành viên</Label>
            <Select name="userId" required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lý do</Label>
            <Input name="reason" placeholder="VD: Đi muộn, Thẻ vàng" required />
          </div>
          <div className="space-y-2">
            <Label>Số tiền phạt ($)</Label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <Button type="submit" variant="destructive" className="w-full">Gán phạt</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { addTransaction } from '@/app/(main)/funds/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRef } from 'react'

export function AddTransactionForm({ members }: { members: any[] }) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await addTransaction(formData)
    if (result?.success) {
      toast.success(result.message)
      formRef.current?.reset()
    } else {
      toast.error(result?.message || 'Thêm giao dịch thất bại')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm giao dịch</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <Select name="type" defaultValue="contribution">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">Đóng góp</SelectItem>
                  <SelectItem value="expense">Chi tiêu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền</Label>
              <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Input name="category" placeholder="VD: Quỹ tháng, Dụng cụ" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Mô tả / Lý do</Label>
              <Input name="reason" placeholder="Chi tiết về giao dịch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">Thành viên (cho đóng góp)</Label>
              <Select name="memberId">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không / Chung</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            Thêm giao dịch
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { setRole, removeMember, setStatus, updateMemberDetails } from '@/app/(main)/team/actions'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Crown, User, Shirt, CheckCircle, XCircle, AlertTriangle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface Props {
  member: any
  isAdmin: boolean
}

export function MemberCard({ member, isAdmin }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  const handleRoleChange = async (val: string) => {
    const fd = new FormData()
    fd.append('userId', member._id)
    fd.append('role', val)
    const result = await setRole(fd)
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Cập nhật vai trò thất bại')
    }
  }

  const handleStatusChange = async (val: string) => {
    const fd = new FormData()
    fd.append('userId', member._id)
    fd.append('status', val)
    const result = await setStatus(fd)
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Cập nhật trạng thái thất bại')
    }
  }

  const handleRemove = async () => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${member.name}?`)) {
      const result = await removeMember(member._id)
      if (result?.success) {
        toast.success(result.message)
      } else {
        toast.error(result?.message || 'Xóa thành viên thất bại')
      }
    }
  }

  const handleUpdateDetails = async (formData: FormData) => {
    const result = await updateMemberDetails(formData)
    if (result?.success) {
      toast.success(result.message)
      setIsEditOpen(false)
    } else {
      toast.error(result?.message || 'Cập nhật thông tin thất bại')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-800 text-white font-bold text-lg">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">{member.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              member.role === 'admin' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-slate-100 text-slate-800'
            }`}>
              {member.role === 'admin' ? <><Crown className="h-3 w-3" /> Quản trị viên</> : <><User className="h-3 w-3" /> Thành viên</>}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              member.status === 'active' ? 'bg-green-100 text-green-800' :
              member.status === 'unavailable' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {member.status === 'active' ? <CheckCircle className="h-3 w-3" /> : 
               member.status === 'unavailable' ? <AlertTriangle className="h-3 w-3" /> : 
               <XCircle className="h-3 w-3" />}
              <span className="capitalize">
                {member.status === 'active' ? 'Hoạt động' : 
                 member.status === 'unavailable' ? 'Tạm vắng' : 'Không hoạt động'}
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          {member.position && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Shirt className="h-3 w-3" /> {member.position}</p>
          )}
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex items-center space-x-3">
          <div className="w-32">
            <Select defaultValue={member.status || 'active'} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="unavailable">Tạm vắng</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <Select defaultValue={member.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
                <DialogDescription>
                  Cập nhật thông tin cho {member.name}.
                </DialogDescription>
              </DialogHeader>
              <form action={handleUpdateDetails}>
                <input type="hidden" name="userId" value={member._id} />
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Tên
                    </Label>
                    <Input id="name" name="name" defaultValue={member.name} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" name="email" defaultValue={member.email} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="position" className="text-right">
                      Vị trí
                    </Label>
                    <Input id="position" name="position" defaultValue={member.position} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Lưu thay đổi</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="destructive" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

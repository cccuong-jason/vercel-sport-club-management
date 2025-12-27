'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { markRecordAsPaid } from "@/app/(main)/funds/actions"
import { toast } from "sonner"
import { AssignPenaltyForm } from "./AssignPenaltyForm"
import { CheckCircle, Clock, Search } from "lucide-react"

interface Props {
  penalties: any[]
  members: any[]
  isAdmin: boolean
}

export function PenaltiesList({ penalties, members, isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleMarkPaid = async (recordId: string) => {
    const result = await markRecordAsPaid(recordId)
    if (result?.success) toast.success("Đã đánh dấu đã nộp")
    else toast.error(result?.message || "Có lỗi xảy ra")
  }

  const filteredPenalties = penalties.filter(p => {
    const matchesSearch = p.reason.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.userName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Tiền phạt</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chưa nộp</SelectItem>
              <SelectItem value="paid">Đã nộp</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <AssignPenaltyForm members={members} />}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPenalties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Không tìm thấy tiền phạt nào.</div>
        ) : (
          filteredPenalties.map((p) => (
            <Card key={p._id} className={p.status === 'paid' ? 'opacity-60 bg-muted/50' : 'border-l-4 border-l-red-500'}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold text-lg">{p.reason}</div>
                  <div className="text-muted-foreground">
                    Phạt <span className="font-medium text-foreground">{p.userName}</span> • ${p.amount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ngày: {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div>
                  {p.status === 'paid' ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Đã nộp
                    </Badge>
                  ) : (
                    isAdmin ? (
                      <Button size="sm" onClick={() => handleMarkPaid(p._id)}>
                        Đánh dấu đã nộp
                      </Button>
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="w-3 h-3 mr-1" /> Chưa nộp
                      </Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

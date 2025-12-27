'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Bell, Calendar, Search } from "lucide-react"
import { markRecordAsPaid, sendReminders } from "@/app/(main)/funds/actions"
import { toast } from "sonner"
import { CreateMonthlyFundForm } from "./CreateMonthlyFundForm"

interface Props {
  funds: any[]
  isAdmin: boolean
}

export function MonthlyFundsList({ funds, isAdmin }: Props) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleMarkPaid = async (recordId: string) => {
    const result = await markRecordAsPaid(recordId)
    if (result?.success) toast.success("Đã đánh dấu đã nộp")
    else toast.error(result?.message || "Có lỗi xảy ra")
  }

  const handleRemind = async (requestId: string) => {
    const result = await sendReminders(requestId)
    if (result?.success) toast.success("Đã gửi thông báo nhắc nhở")
    else toast.error(result?.message || "Có lỗi xảy ra")
  }

  const filteredFunds = funds.filter(fund => 
    fund.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Thu quỹ hàng tháng</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm quỹ..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && <CreateMonthlyFundForm />}
        </div>
      </div>

      {filteredFunds.length === 0 && (
        <div className="text-center text-muted-foreground py-8">Không tìm thấy quỹ nào.</div>
      )}

      <Accordion type="single" collapsible className="w-full space-y-4">
        {filteredFunds.map((fund) => {
          const paidCount = fund.records.filter((r: any) => r.status === 'paid').length
          const totalCount = fund.records.length
          const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0
          
          return (
            <AccordionItem key={fund._id} value={fund._id} className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between mr-4">
                  <div className="text-left">
                    <div className="font-semibold">{fund.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Hạn nộp: {new Date(fund.dueDate).toLocaleDateString('vi-VN')}
                      <Badge variant="outline" className="ml-2">${fund.amount}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{paidCount}/{totalCount} Đã nộp</div>
                    <div className="w-32 h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-4">
                  {isAdmin && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleRemind(fund._id)}>
                        <Bell className="mr-2 h-3 w-3" /> Nhắc nhở thành viên chưa nộp
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fund.records.map((record: any) => (
                      <div key={record._id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${record.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={record.status === 'paid' ? 'text-muted-foreground line-through' : 'font-medium'}>
                            {record.userName}
                          </span>
                        </div>
                        {record.status === 'paid' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" /> Đã nộp
                          </Badge>
                        ) : (
                          isAdmin ? (
                            <Button size="sm" variant="outline" onClick={() => handleMarkPaid(record._id)}>
                              Đã nộp
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-200">Chưa nộp</Badge>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

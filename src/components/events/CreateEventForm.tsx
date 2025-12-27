'use client'

import { createEvent } from '@/app/(main)/events/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

export function CreateEventForm({ seasons = [] }: { seasons?: any[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await createEvent(formData)
    if (result?.success) {
      toast.success(result.message)
      formRef.current?.reset()
      setDate(new Date())
    } else {
      toast.error(result?.message || 'Tạo sự kiện thất bại')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo sự kiện</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input name="title" placeholder="Tiêu đề sự kiện" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <Select name="type" defaultValue="training">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Tập luyện</SelectItem>
                  <SelectItem value="match">Trận đấu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lịch trình (Ngày & Giờ)</Label>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Date Picker */}
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="date" value={date?.toISOString() || ''} />
              </div>

              {/* Start Time */}
              <div className="w-full md:w-32">
                <Input 
                  name="startTime" 
                  type="time" 
                  placeholder="Bắt đầu" 
                  required 
                  className="w-full"
                />
              </div>

              {/* End Time */}
              <div className="w-full md:w-32">
                <Input 
                  name="endTime" 
                  type="time" 
                  placeholder="Kết thúc" 
                  required 
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Địa điểm</Label>
              <Input name="location" placeholder="Sân hoặc địa chỉ" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonId">Mùa giải (Tùy chọn)</Label>
              <Select name="seasonId">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mùa giải" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {seasons.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit">Tạo sự kiện</Button>
        </form>
      </CardContent>
    </Card>
  )
}

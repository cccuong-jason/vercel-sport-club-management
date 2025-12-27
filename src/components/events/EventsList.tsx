"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, MapPin, Clock, Trophy, Dumbbell, Search, Filter } from 'lucide-react'
import Link from "next/link"

interface Event {
  _id: string
  title: string
  type: 'match' | 'training'
  date: string
  startTime: string
  endTime: string
  location?: string
}

interface EventsListProps {
  events: Event[]
}

export function EventsList({ events }: EventsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === "all" || event.type === typeFilter
    
    const eventDate = new Date(event.date)
    const now = new Date()
    // Reset time for date comparison
    now.setHours(0, 0, 0, 0)
    
    let matchesStatus = true
    if (statusFilter === "upcoming") {
      matchesStatus = eventDate >= now
    } else if (statusFilter === "past") {
      matchesStatus = eventDate < now
    }

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sự kiện..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Loại sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="match">Trận đấu</SelectItem>
              <SelectItem value="training">Tập luyện</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="upcoming">Sắp tới</SelectItem>
              <SelectItem value="past">Đã qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Không tìm thấy sự kiện nào.
          </div>
        ) : (
          filteredEvents.map((e) => (
            <Card key={e._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{e.title}</CardTitle>
                    <CardDescription className="capitalize flex items-center gap-1">
                      {e.type === 'match' ? <><Trophy className="h-4 w-4" /> Trận đấu</> : <><Dumbbell className="h-4 w-4" /> Tập luyện</>}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(e.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{e.startTime} - {e.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{e.location || 'Chưa xác định'}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/attendance/${e._id}`}>Điểm danh</Link>
                </Button>
                {e.type === 'match' && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/voting/${e._id}`}>Bình chọn MVP</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/match-payments/${e._id}`}>Thanh toán</Link>
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isToday, isSameMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { cn } from '@/lib/utils'

async function getMonthEvents(date = new Date()) {
  await connectDB()
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const items = await Event.find({ date: { $gte: start, $lte: end } }).lean<any>()
  return items
}

export default async function CalendarPage() {
  const today = new Date()
  const events = await getMonthEvents(today)
  const start = startOfWeek(startOfMonth(today), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(today), { weekStartsOn: 1 })
  const days: Date[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Schedule view of all training sessions and matches.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
            {weekDays.map((day) => (
              <div key={day} className="bg-background p-2 text-center text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((d, idx) => {
              const dayEvents = events.filter((e: any) => isSameDay(new Date(e.date), d))
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "min-h-[120px] bg-background p-2 transition-colors hover:bg-muted/50",
                    !isSameMonth(d, today) && "bg-muted/20 text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "mb-2 font-medium text-sm w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(d) && "bg-primary text-primary-foreground"
                  )}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((e: any) => (
                      <Link 
                        key={e._id}
                        href={`/events/${e._id}`}
                        className={cn(
                          "block text-xs p-1 rounded truncate",
                          e.type === 'match' 
                            ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" 
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                        )}
                      >
                        {e.type === 'match' ? '⚽' : '🏃'} {e.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

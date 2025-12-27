import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { Season } from '@/models/Season'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { CreateEventForm } from '@/components/events/CreateEventForm'
import { EventsList } from '@/components/events/EventsList'

async function listEvents() {
  await connectDB()
  const items = await Event.find().sort({ date: -1 }).lean<any>()
  return items.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
    date: item.date.toISOString(),
  }))
}

async function getSeasons() {
  await connectDB()
  const seasons = await Season.find().sort({ startDate: -1 }).lean<any>()
  return seasons.map((s: any) => ({
    ...s,
    _id: s._id.toString(),
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString()
  }))
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions)
  const events = await listEvents()
  const seasons = await getSeasons()
  
  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sự kiện</h1>
          <p className="text-muted-foreground">Các trận đấu và buổi tập sắp tới.</p>
        </div>
      </div>

      {isAdmin((session as any)?.role) && <CreateEventForm seasons={seasons} />}

      <EventsList events={events} />
    </main>
  )
}

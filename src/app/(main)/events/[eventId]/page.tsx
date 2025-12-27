import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { RSVP } from '@/models/RSVP'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function EventDetail(props: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/signin')
  await connectDB()
  const event = await Event.findById(eventId).lean<any>()
  if (!event) return <main className="p-6">Event not found</main>
  
  const user = await User.findOne({ email: session.user?.email }).lean<any>()
  const myRsvp = user ? await RSVP.findOne({ eventId, userId: user._id }).lean<any>() : null
  const allRsvps = await RSVP.find({ eventId }).lean<any>()
  const rsvpCounts = {
    yes: allRsvps.filter((r: any) => r.status === 'yes').length,
    no: allRsvps.filter((r: any) => r.status === 'no').length,
    maybe: allRsvps.filter((r: any) => r.status === 'maybe').length
  }

  async function rsvp(formData: FormData) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return
    await connectDB()
    const status = String(formData.get('status') || 'maybe') as 'yes'|'no'|'maybe'
    const userEmail = session.user.email as string
    const user = await (await import('@/models/User')).User.findOne({ email: userEmail })
    if (!user) return
    await RSVP.updateOne({ eventId, userId: user._id }, { status }, { upsert: true })
    revalidatePath(`/events/${eventId}`)
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {event.type === 'training' ? 'Training' : 'Match'}
              </span>
              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
              <span>🕐 {new Date(event.date).toLocaleTimeString()}</span>
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Attendance</div>
            <div className="text-2xl font-bold text-green-600">{rsvpCounts.yes}</div>
            <div className="text-xs text-gray-500">Going</div>
          </div>
        </div>
        
        {(event.startTime || event.endTime) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              {event.startTime && <span>Start: {event.startTime}</span>}
              {event.endTime && <span className="ml-4">End: {event.endTime}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Your RSVP</h2>
          {myRsvp ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  myRsvp.status === 'yes' ? 'bg-green-100 text-green-800' :
                  myRsvp.status === 'no' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {myRsvp.status === 'yes' ? '✅ Going' : 
                   myRsvp.status === 'no' ? '❌ Not Going' : 
                   '⚠️ Maybe'}
                </span>
              </div>
              
              <form action={rsvp} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change your response:</label>
                  <select name="status" className="w-full rounded-md border border-gray-300 p-3 focus:ring-blue-500 focus:border-blue-500">
                    <option value="yes">✅ Going</option>
                    <option value="no">❌ Not Going</option>
                    <option value="maybe">⚠️ Maybe</option>
                  </select>
                </div>
                <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
                  Update RSVP
                </button>
              </form>
            </div>
          ) : (
            <form action={rsvp} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Will you attend?</label>
                <select name="status" className="w-full rounded-md border border-gray-300 p-3 focus:ring-blue-500 focus:border-blue-500">
                  <option value="yes">✅ Going</option>
                  <option value="no">❌ Not Going</option>
                  <option value="maybe">⚠️ Maybe</option>
                </select>
              </div>
              <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
                Submit RSVP
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                Going
              </span>
              <span className="font-bold text-green-800">{rsvpCounts.yes}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                Not Going
              </span>
              <span className="font-bold text-red-800">{rsvpCounts.no}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                Maybe
              </span>
              <span className="font-bold text-yellow-800">{rsvpCounts.maybe}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Responses:</span>
                <span className="font-bold">{allRsvps.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

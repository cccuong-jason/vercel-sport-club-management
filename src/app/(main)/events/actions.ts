'use server'

import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { EventSchema } from '@/lib/validators'
import { createNotification } from '@/lib/notifications'

export async function createEvent(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  const input = {
    title: String(formData.get('title') || ''),
    type: String(formData.get('type') || 'training') as 'training'|'match',
    date: String(formData.get('date') || ''),
    startTime: String(formData.get('startTime') || ''),
    endTime: String(formData.get('endTime') || ''),
    location: String(formData.get('location') || '')
  }
  let seasonId = String(formData.get('seasonId') || '')
  if (seasonId === 'none') seasonId = ''
  
  const parsed = EventSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Invalid event data' }
  
  await connectDB()
  
  try {
    const event = await Event.create({
      ...parsed.data,
      date: new Date(parsed.data.date),
      teamId: null,
      seasonId: seasonId || null,
      createdBy: null
    })
    
    // Send In-App Notification
    try {
      await createNotification(
        'all',
        `New ${event.type} scheduled: ${event.title} on ${event.date.toLocaleDateString()}`,
        'info',
        `/events`
      )
    } catch (error) {
      console.error('Failed to send notifications:', error)
    }
    
    revalidatePath('/events')
    return { success: true, message: 'Event created successfully' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Failed to create event' }
  }
}

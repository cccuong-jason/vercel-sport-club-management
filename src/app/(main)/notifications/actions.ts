'use server'

import { connectDB } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { User } from '@/models/User'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return []
  
  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  if (!user) return []

  const notifications = await Notification.find({ recipientId: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  return notifications.map((n: any) => ({
    ...n,
    _id: n._id.toString(),
    recipientId: n.recipientId.toString(),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString()
  }))
}

export async function markAsRead(notificationId: string) {
  const session = await getServerSession(authOptions)
  if (!session) return
  
  await connectDB()
  await Notification.findByIdAndUpdate(notificationId, { read: true })
  revalidatePath('/notifications') // Optional, mostly client-side state update
}

export async function markAllAsRead() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return
  
  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  if (!user) return

  await Notification.updateMany(
    { recipientId: user._id, read: false },
    { read: true }
  )
}

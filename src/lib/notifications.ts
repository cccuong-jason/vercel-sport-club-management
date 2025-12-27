import { connectDB } from '@/lib/db'
import { Notification } from '@/models/Notification'
import { User } from '@/models/User'

export async function createNotification(
  recipientIds: string[] | 'all',
  message: string,
  type: 'info' | 'success' | 'warning' = 'info',
  link?: string
) {
  await connectDB()

  let targets: string[] = []

  if (recipientIds === 'all') {
    // Notify all users regardless of status for now, to ensure delivery during testing
    const users = await User.find({}).select('_id')
    targets = users.map(u => u._id.toString())
  } else {
    targets = recipientIds
  }

  if (targets.length === 0) return

  const notifications = targets.map(id => ({
    recipientId: id,
    message,
    type,
    link,
    read: false,
    createdAt: new Date()
  }))

  await Notification.insertMany(notifications)
}

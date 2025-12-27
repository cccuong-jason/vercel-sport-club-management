'use client'

import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '@/app/(main)/notifications/actions'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  _id: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = async () => {
    const data = await getNotifications()
    setNotifications(data)
    setUnreadCount(data.filter((n: any) => !n.read).length)
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold leading-none">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="grid gap-1">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/20 border-l-2 border-primary"
                  )}
                  onClick={() => !notification.read && handleMarkRead(notification._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-none">
                      {notification.link ? (
                        <Link href={notification.link} className="hover:underline" onClick={() => setIsOpen(false)}>
                          {notification.message}
                        </Link>
                      ) : (
                        notification.message
                      )}
                    </p>
                    {!notification.read && (
                      <span className="flex h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

'use client'

import { setOne } from '@/app/(main)/attendance/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { useOptimistic, startTransition } from 'react'

interface Props {
  eventId: string
  user: { _id: string; name: string; email: string }
  status: string
}

export function AttendanceRow({ eventId, user, status }: Props) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    status,
    (state, newStatus: string) => newStatus
  )

  const handleStatusChange = (val: string) => {
    startTransition(() => {
      setOptimisticStatus(val)
      const fd = new FormData()
      fd.append('eventId', eventId)
      fd.append('userId', user._id)
      fd.append('status', val)
      setOne(fd)
    })
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'unexpected': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'present': return <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Present</div>
      case 'absent': return <div className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Absent</div>
      case 'unexpected': return <div className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Unexpected</div>
      default: return <div className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Not Marked</div>
    }
  }

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(optimisticStatus)}`}>
          {getStatusLabel(optimisticStatus)}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end">
          <div className="w-[140px]">
            <Select value={optimisticStatus === 'not-marked' ? undefined : optimisticStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Mark status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" /> Present
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" /> Absent
                  </div>
                </SelectItem>
                <SelectItem value="unexpected">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" /> Unexpected
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

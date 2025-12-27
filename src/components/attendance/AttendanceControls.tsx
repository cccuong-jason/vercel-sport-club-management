'use client'

import { markAll } from '@/app/(main)/attendance/actions'
import { Button } from '@/components/ui/button'

export function AttendanceControls({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => markAll(eventId, 'present')}
      >
        Mark all Present
      </Button>
      <Button 
        size="sm" 
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => markAll(eventId, 'absent')}
      >
        Mark all Absent
      </Button>
      <Button 
        size="sm" 
        className="bg-yellow-600 hover:bg-yellow-700 text-white"
        onClick={() => markAll(eventId, 'unexpected')}
      >
        Mark all Unexpected
      </Button>
    </div>
  )
}

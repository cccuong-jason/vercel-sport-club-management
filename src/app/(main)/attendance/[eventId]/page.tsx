import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { AttendanceControls } from '@/components/attendance/AttendanceControls'
import { AttendanceRow } from '@/components/attendance/AttendanceRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AttendancePage(props: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await props.params
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any)?.role)) redirect('/signin')
  await connectDB()
  
  const event = await (await import('@/models/Event')).Event.findById(eventId).lean<any>()
  const users = await User.find().lean<any>().then(users => users.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString()
  })))
  const records = await Attendance.find({ eventId }).lean<any>()
  const byUser: Record<string, any> = {}
  for (const r of records) byUser[String(r.userId)] = r

  const stats = {
    present: records.filter((r: any) => r.status === 'present').length,
    absent: records.filter((r: any) => r.status === 'absent').length,
    unexpected: records.filter((r: any) => r.status === 'unexpected').length,
    total: users.length
  }

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          {event && (
            <p className="text-muted-foreground">{event.title} - {new Date(event.date).toLocaleDateString()}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Members</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">Present</div>
              <div className="text-2xl font-bold text-green-800">{stats.present}</div>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-red-50/50 border-red-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-600">Absent</div>
              <div className="text-2xl font-bold text-red-800">{stats.absent}</div>
            </div>
            <XCircle className="h-6 w-6 text-red-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-600">Unexpected</div>
              <div className="text-2xl font-bold text-yellow-800">{stats.unexpected}</div>
            </div>
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Attendance Rate</div>
              <div className="text-2xl font-bold text-blue-800">
                {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
              </div>
            </div>
            <Activity className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
          <CardTitle>Member Attendance</CardTitle>
          <AttendanceControls eventId={eventId} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => {
                const rec = byUser[String(u._id)]
                const status = rec?.status || 'not-marked'
                return (
                  <AttendanceRow 
                    key={u._id} 
                    eventId={eventId} 
                    user={{ _id: String(u._id), name: u.name, email: u.email }} 
                    status={status} 
                  />
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

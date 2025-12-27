import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

async function computeAttendance() {
  await connectDB()
  const users = await User.find().lean<any>()
  const records = await Attendance.find().lean<any>()
  const byUser: Record<string, { total: number, present: number }> = {}
  for (const u of users) byUser[String(u._id)] = { total: 0, present: 0 }
  for (const r of records) {
    const id = String(r.userId)
    if (!byUser[id]) byUser[id] = { total: 0, present: 0 }
    byUser[id].total += 1
    if (r.status === 'present') byUser[id].present += 1
  }
  const entries = users.map((u: any) => ({
    userId: String(u._id),
    name: u.name,
    email: u.email,
    percent: byUser[String(u._id)].total ? Math.round((byUser[String(u._id)].present / byUser[String(u._id)].total) * 100) : 0,
    total: byUser[String(u._id)].total,
    present: byUser[String(u._id)].present
  })).sort((a: any, b: any) => b.percent - a.percent)
  return entries
}

export default async function AttendanceReportPage() {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any)?.role)) return <main className="p-6">Admins only</main>
  const entries = await computeAttendance()
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Report</h1>
        <p className="text-muted-foreground">Overall attendance statistics for all team members.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Attendance</CardTitle>
          <CardDescription>Ranked by attendance percentage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-1 divide-y">
              <div className="flex items-center justify-between bg-muted p-3 text-sm font-medium text-muted-foreground">
                <span>Member</span>
                <span>Stats</span>
              </div>
              {entries.map((e: any, idx: number) => (
                <div key={e.userId} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium">#{idx+1} {e.name}</span>
                    <span className="text-xs text-muted-foreground">{e.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{e.percent}%</div>
                      <div className="text-xs text-muted-foreground">{e.present}/{e.total} sessions</div>
                    </div>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${e.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No members found.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

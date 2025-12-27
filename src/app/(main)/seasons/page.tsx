import { connectDB } from '@/lib/db'
import { Season } from '@/models/Season'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { User } from '@/models/User'
import { Vote } from '@/models/Vote'
import { Attendance } from '@/models/Attendance'
import { decryptSelections } from '@/lib/crypto'
import { tallyVotes, sortWithTiebreakers, attendancePoint } from '@/lib/scoring'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

async function listSeasons() {
  await connectDB()
  return Season.find().sort({ startDate: -1 }).lean<any>()
}

export default async function SeasonsPage() {
  const session = await getServerSession(authOptions)
  const seasons = await listSeasons()
  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
        <p className="text-muted-foreground">Manage competitive seasons and view historical leaderboards.</p>
      </div>
      
      {isAdmin((session as any)?.role) && <CreateSeasonForm />}
      
      <div className="grid grid-cols-1 gap-6">
        {seasons.map((s: any) => (
          <SeasonRow key={s._id} season={s} />
        ))}
        {seasons.length === 0 && (
          <div className="text-center py-10 text-muted-foreground bg-white rounded-lg border border-dashed">
            No seasons created yet.
          </div>
        )}
      </div>
    </main>
  )
}

function CreateSeasonForm() {
  async function create(formData: FormData) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!isAdmin((session as any).role)) return
    await connectDB()
    const name = String(formData.get('name') || '')
    const startDate = new Date(String(formData.get('startDate') || ''))
    const endDate = new Date(String(formData.get('endDate') || ''))
    if (!name || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return
    await Season.create({ name, startDate, endDate, teamId: null, createdBy: null })
    revalidatePath('/seasons')
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Season</CardTitle>
        <CardDescription>Define a new time range for tracking points and MVP stats.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Season Name</Label>
              <Input name="name" id="name" placeholder="e.g. Summer 2025" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input name="startDate" id="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input name="endDate" id="endDate" type="date" required />
            </div>
          </div>
          <Button type="submit">Create Season</Button>
        </form>
      </CardContent>
    </Card>
  )
}

async function computeLeaderboard(from: Date, to: Date) {
  await connectDB()
  const users = await User.find().lean<any>()
  const votes = await Vote.find().lean<any>()
  const decoded: Array<{ playerId: string, placement: 1|2|3 }> = []
  for (const v of votes) {
    try {
      const d = JSON.parse(decryptSelections(v.selectionsEnc))
      decoded.push({ playerId: d.first, placement: 1 })
      decoded.push({ playerId: d.second, placement: 2 })
      decoded.push({ playerId: d.third, placement: 3 })
    } catch {}
  }
  const voteTallies = tallyVotes(decoded)
  const attendance = await Attendance.find().lean<any>()
  const attendanceTallies: Record<string, number> = {}
  for (const a of attendance) {
    const created = new Date(a.createdAt)
    if (from && created < from) continue
    if (to && created > to) continue
    const id = String(a.userId)
    attendanceTallies[id] = (attendanceTallies[id] || 0) + attendancePoint(a.status)
  }
  
  const combined = voteTallies.map(v => ({
    playerId: v.playerId,
    total: v.total + (attendanceTallies[v.playerId] ? attendanceTallies[v.playerId] / 4 : 0),
    firsts: v.firsts,
    seconds: v.seconds,
    thirds: v.thirds,
    mvpPoints: v.total,
    attendancePoints: attendanceTallies[v.playerId] || 0
  }))
  
  for (const u of users) {
    const id = String(u._id)
    if (!combined.find(c => c.playerId === id)) {
      combined.push({ 
        playerId: id, 
        total: attendanceTallies[id] ? attendanceTallies[id] / 4 : 0, 
        firsts: 0, seconds: 0, thirds: 0, 
        mvpPoints: 0, 
        attendancePoints: attendanceTallies[id] || 0 
      })
    }
  }
  return { users, entries: sortWithTiebreakers(combined) }
}

async function Leaderboard({ season }: { season: any }) {
  const { users, entries } = await computeLeaderboard(new Date(season.startDate), new Date(season.endDate))
  return (
    <div className="mt-4 rounded-md border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Name</th>
              <th className="px-4 py-3 text-right font-bold">Chuyên cần</th>
              <th className="px-4 py-3 text-right font-bold">Thái độ thi đấu</th>
              <th className="px-4 py-3 text-right font-bold">Tiến bộ cá nhân</th>
              <th className="px-4 py-3 text-right font-bold">Đóng góp ngoài sân</th>
              <th className="px-4 py-3 text-right font-bold">MVP</th>
              <th className="px-4 py-3 text-right font-bold bg-green-200 text-black">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">No data recorded for this period.</td>
              </tr>
            )}
            {entries.map((e: any, idx: number) => (
              <tr key={e.playerId} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">
                  {users.find((u: any) => String(u._id) === e.playerId)?.name || e.playerId}
                </td>
                <td className="px-4 py-3 text-right">{e.attendancePoints}</td>
                <td className="px-4 py-3 text-right">0</td>
                <td className="px-4 py-3 text-right">0</td>
                <td className="px-4 py-3 text-right">0</td>
                <td className="px-4 py-3 text-right">{e.mvpPoints}</td>
                <td className="px-4 py-3 text-right font-bold bg-green-100">{e.total.toFixed(1).replace('.0', '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SeasonRow({ season }: { season: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{season.name}</CardTitle>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {new Date(season.startDate).toLocaleDateString()} — {new Date(season.endDate).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Leaderboard season={season} />
      </CardContent>
    </Card>
  )
}

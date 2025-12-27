import { connectDB } from '@/lib/db'
import { Vote } from '@/models/Vote'
import { Attendance } from '@/models/Attendance'
import { User } from '@/models/User'
import { Season } from '@/models/Season'
import { decryptSelections } from '@/lib/crypto'
import { tallyVotes, sortWithTiebreakers, attendancePoint } from '@/lib/scoring'
import { isAdmin } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

async function compute(from?: Date, to?: Date) {
  await connectDB()
  const users = await User.find().lean<any>()
  const votes = await Vote.find().lean<any>()
  const decoded: Array<{ playerId: string, placement: 1|2|3 }> = []
  for (const v of votes) {
    const d = JSON.parse(decryptSelections(v.selectionsEnc))
    decoded.push({ playerId: d.first, placement: 1 })
    decoded.push({ playerId: d.second, placement: 2 })
    decoded.push({ playerId: d.third, placement: 3 })
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
    total: v.total + (attendanceTallies[v.playerId] || 0),
    firsts: v.firsts,
    seconds: v.seconds,
    thirds: v.thirds,
    mvpPoints: v.total,
    attendancePoints: attendanceTallies[v.playerId] || 0
  }))
  for (const u of users) {
    const id = String(u._id)
    if (!combined.find(c => c.playerId === id)) {
      combined.push({ playerId: id, total: attendanceTallies[id] || 0, firsts: 0, seconds: 0, thirds: 0, mvpPoints: 0, attendancePoints: attendanceTallies[id] || 0 })
    }
  }
  return { users, entries: sortWithTiebreakers(combined) }
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)
  const isUserAdmin = isAdmin((session as any)?.role)
  const seasons = isUserAdmin ? await Season.find().sort({ startDate: -1 }).lean<any>() : []
  const { users, entries } = await compute()
  
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">Team rankings based on MVP votes and attendance</p>
        </div>
        {isUserAdmin && (
          <div className="flex items-center space-x-3">
            <select className="rounded-md border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Time</option>
              {seasons.map((season: any) => (
                <option key={season._id} value={season._id}>
                  {season.name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              Create Season
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Player Rankings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {entries.map((e: any, idx: number) => (
                <div key={e.playerId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {users.find((u: any) => String(u._id) === e.playerId)?.name || 'Unknown Player'}
                        </div>
                        <div className="text-sm text-gray-500">
                          MVP: {e.mvpPoints} pts • Attendance: {e.attendancePoints} pts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{e.total} pts</div>
                      <div className="text-sm text-gray-500">Total Score</div>
                    </div>
                  </div>
                  
                  {isUserAdmin && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-yellow-600">{e.firsts}</div>
                          <div className="text-gray-500">1st Place Votes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-600">{e.seconds}</div>
                          <div className="text-gray-500">2nd Place Votes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{e.thirds}</div>
                          <div className="text-gray-500">3rd Place Votes</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoring System</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">🥇 1st Place</span>
                <span className="font-bold text-yellow-600">5 points</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">🥈 2nd Place</span>
                <span className="font-bold text-gray-600">3 points</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">🥉 3rd Place</span>
                <span className="font-bold text-orange-600">1 point</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <strong>Attendance:</strong> +1 for present, -1 for absent, 0 for unexpected
              </p>
            </div>
          </div>

          {isUserAdmin && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Controls</h3>
              <div className="space-y-3">
                <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
                  Export Rankings
                </button>
                <button className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors">
                  Reset Season
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
export const dynamic = 'force-dynamic'

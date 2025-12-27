import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { Vote } from '@/models/Vote'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, ExternalLink, Vote as VoteIcon, Trophy, Dumbbell } from 'lucide-react'
import Link from 'next/link'

async function listMatchEvents() {
  await connectDB()
  // Find events of type 'match' or 'training'
  const events = await Event.find({ 
    type: { $in: ['match', 'training'] } 
  }).sort({ date: -1 }).lean<any>()
  return events.map((m: any) => ({
    ...m,
    _id: m._id.toString(),
    date: m.date.toISOString(),
    teamId: m.teamId?.toString(),
    seasonId: m.seasonId?.toString()
  }))
}

async function getVoteCounts() {
  await connectDB()
  const votes = await Vote.aggregate([
    { $group: { _id: '$matchId', count: { $sum: 1 } } }
  ])
  const map: Record<string, number> = {}
  votes.forEach((v: any) => { map[v._id.toString()] = v.count })
  return map
}

export default async function VotingDashboardPage() {
  const session = await getServerSession(authOptions)
  const matches = await listMatchEvents()
  const voteCounts = await getVoteCounts()
  const isUserAdmin = isAdmin((session as any)?.role)

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voting Sessions</h1>
        <p className="text-muted-foreground">Active and past MVP voting sessions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match: any) => {
          const voteCount = voteCounts[match._id] || 0
          const isPast = new Date(match.date) < new Date()
          
          return (
            <Card key={match._id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl line-clamp-1 flex items-center gap-2">
                    {match.type === 'match' ? <Trophy className="h-5 w-5 text-yellow-600" /> : <Dumbbell className="h-5 w-5 text-blue-600" />}
                    {match.title}
                  </CardTitle>
                  {isPast ? (
                     <Badge variant="secondary">Ended</Badge>
                  ) : (
                     <Badge variant="default" className="bg-green-600">Active</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(match.date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {match.location || 'No location'}
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                   <div className="text-sm font-medium text-muted-foreground">Votes Cast</div>
                   <div className="text-2xl font-bold">{voteCount}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex gap-2">
                <Button asChild className="w-full">
                  <Link href={`/voting/${match._id}`}>
                    <VoteIcon className="mr-2 h-4 w-4" />
                    {isUserAdmin ? 'Manage Session' : 'Vote Now'}
                  </Link>
                </Button>
                {isUserAdmin && (
                   <Button variant="outline" size="icon" asChild>
                     <Link href={`/voting/${match._id}`} target="_blank">
                       <ExternalLink className="h-4 w-4" />
                     </Link>
                   </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
        
        {matches.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No match events found. Create a match event to enable voting.
          </div>
        )}
      </div>
    </main>
  )
}

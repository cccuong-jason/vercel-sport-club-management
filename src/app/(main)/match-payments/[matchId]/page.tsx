import { connectDB } from '@/lib/db'
import { MatchPayment } from '@/models/MatchPayment'
import { User } from '@/models/User'
import { Event } from '@/models/Event'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { PaymentForm } from '@/components/match-payments/PaymentForm'
import { PaymentRow } from '@/components/match-payments/PaymentRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, Clock, DollarSign } from 'lucide-react'

export default async function MatchPaymentsPage(props: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await props.params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/signin')
  await connectDB()
  
  // Get match details
  const match = await Event.findById(matchId).lean<any>()
  if (!match || match.type !== 'match') redirect('/events')
  
  const users = await User.find().lean<any>().then(users => users.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString()
  })))
  const payments = await MatchPayment.find({ matchId }).lean<any>().then(pmts => pmts.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    userId: p.userId.toString(),
    requestedAt: p.requestedAt?.toISOString(),
    confirmedAt: p.confirmedAt?.toISOString()
  })))
  const byUser: Record<string, any> = {}
  for (const p of payments) byUser[String(p.userId)] = p

  // Calculate payment statistics
  const totalPlayers = users.length
  const paidPlayers = payments.filter((p: any) => p.status === 'paid').length
  const pendingPlayers = payments.filter((p: any) => p.status === 'pending').length
  const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  const isUserAdmin = isAdmin((session as any).role)

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Payments</h1>
          <p className="text-muted-foreground">{match.title} - {new Date(match.date).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Match ID</div>
          <div className="text-lg font-mono">{matchId.slice(-6)}</div>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Total Players</div>
              <div className="text-2xl font-bold text-blue-800">{totalPlayers}</div>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">Paid Players</div>
              <div className="text-2xl font-bold text-green-800">{paidPlayers}</div>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-800">{pendingPlayers}</div>
            </div>
            <Clock className="h-6 w-6 text-yellow-600" />
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50/50 border-purple-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600">Total Amount</div>
              <div className="text-2xl font-bold text-purple-800">${totalAmount.toFixed(2)}</div>
            </div>
            <DollarSign className="h-6 w-6 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* Member Payment Section */}
      {!isUserAdmin && (
        <PaymentForm matchId={matchId} />
      )}

      {/* Payment List */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u: any) => {
              const p = byUser[String(u._id)]
              const currentUser = String(u._id) === String((session as any)?.user?.id)
              
              return (
                <PaymentRow 
                  key={u._id}
                  matchId={matchId}
                  user={{ _id: String(u._id), name: u.name }}
                  payment={p}
                  isAdmin={isUserAdmin}
                  isCurrentUser={currentUser}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

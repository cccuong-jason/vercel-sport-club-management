import { connectDB } from '@/lib/db'
import { FundTransaction } from '@/models/FundTransaction'
import { User } from '@/models/User'
import { PaymentRequest } from '@/models/PaymentRequest'
import { PaymentRecord } from '@/models/PaymentRecord'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { AddTransactionForm } from '@/components/funds/AddTransactionForm'
import { FundsTabs } from '@/components/funds/FundsTabs'
import { MonthlyFundsList } from '@/components/funds/MonthlyFundsList'
import { PenaltiesList } from '@/components/funds/PenaltiesList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

async function getMembers() {
  await connectDB()
  const members = await User.find({ status: 'active' }, '_id name').lean<any>()
  return members.map((m: any) => ({ ...m, _id: m._id.toString() }))
}

async function listTransactions() {
  await connectDB()
  const items = await FundTransaction.find().sort({ date: -1 }).lean<any>()
  return items.map((i: any) => ({
    ...i,
    _id: i._id.toString(),
    memberId: i.memberId?.toString(),
    date: i.date?.toISOString(),
    createdAt: i.createdAt?.toISOString(),
    updatedAt: i.updatedAt?.toISOString()
  }))
}

async function getMonthlyFunds() {
  await connectDB()
  const funds = await PaymentRequest.find({ type: 'monthly' }).sort({ dueDate: -1 }).lean<any>()
  
  const fundsWithRecords = await Promise.all(funds.map(async (f: any) => {
    const records = await PaymentRecord.find({ requestId: f._id }).populate('userId', 'name').lean<any>()
    
    // Serialize records
    const serializedRecords = records.map((r: any) => ({
      _id: r._id.toString(),
      requestId: r.requestId.toString(),
      userId: {
        _id: r.userId?._id.toString(),
        name: r.userId?.name || 'Unknown'
      },
      amount: r.amount,
      status: r.status,
      paidAt: r.paidAt?.toISOString(),
      transactionId: r.transactionId?.toString(),
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
      userName: r.userId?.name || 'Unknown' // Keep for compatibility if used
    }))

    // Serialize fund request
    return {
      _id: f._id.toString(),
      type: f.type,
      title: f.title,
      amount: f.amount,
      dueDate: f.dueDate?.toISOString(),
      status: f.status,
      targetUserId: f.targetUserId?.toString(),
      createdBy: f.createdBy?.toString(),
      createdAt: f.createdAt?.toISOString(),
      updatedAt: f.updatedAt?.toISOString(),
      records: serializedRecords
    }
  }))
  
  return fundsWithRecords
}

async function getPenalties(userId?: string) {
  await connectDB()
  let query: any = { type: 'penalty' }
  
  const requests = await PaymentRequest.find(query).sort({ createdAt: -1 }).lean<any>()
  
  // For each penalty request, there should be one record (since we create them 1:1)
  // But we need to fetch the status from the record
  const penalties = await Promise.all(requests.map(async (req: any) => {
    const record = await PaymentRecord.findOne({ requestId: req._id }).populate('userId', 'name').lean<any>()
    
    if (!record) return null
    if (userId && record.userId._id.toString() !== userId) return null

    return {
      _id: record._id.toString(), // Use record ID for actions
      requestId: req._id.toString(),
      reason: req.title,
      amount: req.amount,
      createdAt: req.createdAt?.toISOString(),
      userName: record.userId?.name || 'Unknown',
      status: record.status
    }
  }))
  
  return penalties.filter(Boolean)
}

async function getMemberContributions() {
  await connectDB()
  const contributions = await FundTransaction.aggregate([
    { $match: { type: 'contribution' } },
    {
      $lookup: {
        from: 'users',
        localField: 'memberId',
        foreignField: '_id',
        as: 'member'
      }
    },
    { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$memberId',
        memberName: { $first: { $ifNull: ['$member.name', 'Anonymous'] } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ])
  return contributions.map((c: any) => ({ ...c, _id: c._id?.toString() }))
}

export default async function FundsPage() {
  const session = await getServerSession(authOptions)
  const isUserAdmin = isAdmin((session as any)?.role)
  const userId = (session as any)?.user?.id

  const items = await listTransactions()
  const memberContributions = await getMemberContributions()
  const members = await getMembers()
  const monthlyFunds = await getMonthlyFunds()
  const penalties = await getPenalties(isUserAdmin ? undefined : userId)

  const balance = items.reduce((acc: number, t: any) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0)
  const totalContributions = items.filter((t: any) => t.type === 'contribution').reduce((acc: number, t: any) => acc + t.amount, 0)
  const totalExpenses = items.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0)
  
  // Get current user's contributions
  const userContributions = items.filter((t: any) => t.type === 'contribution' && t.memberId?.toString() === userId)
  const userTotalContribution = userContributions.reduce((acc: number, t: any) => acc + t.amount, 0)
  
  const Overview = (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đóng góp</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalContributions.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Contribution Summary */}
      {session?.user && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đóng góp của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Tổng đóng góp</div>
                <div className="text-2xl font-bold text-green-600">${userTotalContribution.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground">Số lần đóng góp</div>
                <div className="text-2xl font-bold text-blue-600">{userContributions.length}</div>
              </div>
            </div>
            
            {userContributions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userContributions.slice(0, 5).map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div>
                      <div className="font-medium">{t.category || t.reason || 'Đóng góp'}</div>
                      <div className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      +${t.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Chưa có đóng góp nào được ghi nhận
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isUserAdmin && <AddTransactionForm members={members} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Giao dịch gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {items.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Chưa có giao dịch nào
                </div>
              ) : (
                items.map((t: any) => {
                  const member = members.find((m: any) => m._id?.toString() === t.memberId?.toString())
                  return (
                    <div key={t._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <span className={t.type === 'contribution' ? 'text-green-600' : 'text-red-600'}>
                            {t.type === 'contribution' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                          </span>
                          {t.category || t.reason || 'Không có mô tả'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(t.date).toLocaleDateString('vi-VN')}
                          {member && <span className="ml-1">• bởi {member.name}</span>}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        t.type === 'contribution' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'contribution' ? '+' : '-'}${t.amount.toFixed(2)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Thành viên đóng góp tích cực</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberContributions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Chưa có đóng góp nào
                </div>
              ) : (
                memberContributions.slice(0, 5).map((contrib: any, index) => (
                  <div key={contrib._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{contrib.memberName}</div>
                        <div className="text-sm text-muted-foreground">{contrib.count} lần đóng góp</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ${contrib.total.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quỹ đội bóng</h1>
        <p className="text-muted-foreground">Quản lý tài chính, quỹ hàng tháng và tiền phạt.</p>
      </div>

      <FundsTabs 
        overview={Overview}
        monthly={<MonthlyFundsList funds={monthlyFunds} isAdmin={isUserAdmin} />}
        penalties={<PenaltiesList penalties={penalties} members={members} isAdmin={isUserAdmin} />}
      />
    </main>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Event } from '@/models/Event'
import { User } from '@/models/User'
import { FundTransaction } from '@/models/FundTransaction'
import { Attendance } from '@/models/Attendance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/Overview"
import { RecentSales } from "@/components/dashboard/RecentSales"
import { CalendarDays, DollarSign, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/signin')
  await connectDB()

  // 1. Fetch Stats
  const usersCount = await User.countDocuments()
  const fundTxns = await FundTransaction.find().lean<any>()
  const balance = fundTxns.reduce((acc: number, t: any) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0)
  
  // 2. Fetch Attendance for Chart
  // Get last 5 events
  const recentEvents = await Event.find({ date: { $lte: new Date() } })
    .sort({ date: -1 })
    .limit(5)
    .lean<any>()
    .then(events => events.reverse()) // Show oldest to newest

  const attendanceData = await Promise.all(recentEvents.map(async (e: any) => {
    const count = await Attendance.countDocuments({ eventId: e._id, status: 'present' })
    return {
      name: new Date(e.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
      total: count
    }
  }))

  // 3. Fetch Recent Transactions for List
  const recentTransactions = await FundTransaction.find()
    .sort({ date: -1 })
    .limit(5)
    .populate('memberId', 'name email')
    .lean<any>()

  // 4. Calculate Attendance Rate (avg of last 5)
  const totalPossible = recentEvents.length * usersCount
  const totalActual = attendanceData.reduce((acc, d) => acc + d.total, 0)
  const attendanceRate = totalPossible > 0 ? Math.round((totalActual / totalPossible) * 100) : 0

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h2>
        <div className="flex items-center space-x-2">
          {/* Calendar Date Range Picker could go here */}
          <Button>Tải báo cáo</Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics" disabled>Phân tích</TabsTrigger>
          <TabsTrigger value="reports" disabled>Báo cáo</TabsTrigger>
          <TabsTrigger value="notifications" disabled>Thông báo</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng quỹ
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% so với tháng trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cầu thủ hoạt động
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersCount}</div>
                <p className="text-xs text-muted-foreground">
                  +2 mới trong tháng
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ tham gia</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Trung bình 5 sự kiện gần nhất
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sự kiện đã tổ chức
                </CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Trong 30 ngày qua
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Tổng quan điểm danh</CardTitle>
                <CardDescription>
                  Sự hiện diện của cầu thủ trong các buổi tập/trận đấu gần đây.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={attendanceData} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Giao dịch gần đây</CardTitle>
                <CardDescription>
                  Các khoản đóng góp và chi tiêu mới nhất.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales transactions={recentTransactions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { TeamList } from '@/components/team/TeamList'

async function listMembers() {
  await connectDB()
  const users = await User.find().lean<any>()
  return users.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString()
  }))
}

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) return <main className="p-6">Vui lòng đăng nhập</main>
  
  const members = await listMembers()
  const isUserAdmin = isAdmin((session as any).role)
  const currentUserId = (session as any).user.id
  
  return (
    <main>
      <TeamList 
        members={members} 
        isAdmin={isUserAdmin} 
        currentUserId={currentUserId}
      />
    </main>
  )
}

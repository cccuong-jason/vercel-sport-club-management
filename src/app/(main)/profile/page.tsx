import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/signin')
  
  await connectDB()
  const user = await User.findOne({ email: session.user.email }).lean<any>()
  
  if (!user) return <div>User not found</div>

  const serializedUser = {
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    dateOfBirth: user.dateOfBirth?.toISOString()
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </div>
      <ProfileForm user={serializedUser} />
    </main>
  )
}

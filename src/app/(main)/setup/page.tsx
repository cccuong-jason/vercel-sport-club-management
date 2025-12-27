import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default async function SetupPage() {
  const session = await getServerSession(authOptions)
  await connectDB()
  const adminExists = await User.countDocuments({ role: 'admin' })
  if (adminExists > 0) redirect('/dashboard')

  async function createManager(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    if (!name || !email || !password) return
    await connectDB()
    const existing = await User.findOne({ email })
    if (existing) return
    const hash = await bcrypt.hash(password, 10)
    await User.create({ name, email, passwordHash: hash, role: 'admin' })
    redirect('/signin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Manager Account</CardTitle>
          <CardDescription>
            No manager exists yet. Create the first admin account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createManager} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Admin Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Create Manager
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

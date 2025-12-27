import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { revalidatePath } from 'next/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default async function InvitePage() {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any)?.role)) return <main className="p-6">Admins only</main>

  async function invite(formData: FormData) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!isAdmin((session as any)?.role)) return
    await connectDB()
    const email = String(formData.get('email') || '')
    const name = String(formData.get('name') || '')
    if (!email) return
    const existing = await User.findOne({ email })
    if (!existing) {
      await User.create({ email, name: name || email.split('@')[0], role: 'member' })
    }
    const link = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?email=${encodeURIComponent(email)}`
    try {
      const { sendEventNotification } = await import('@/lib/mailer')
      await sendEventNotification(email, 'You are invited to Football Club', `Register here: <a href="${link}">${link}</a>`)
    } catch {
      /* SMTP not configured; fall back to showing link */
    }
    revalidatePath('/invite')
  }

  return (
    <main className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Send an email invitation to a new member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={invite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="member@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input id="name" name="name" placeholder="John Doe" />
            </div>
            <Button type="submit" className="w-full">
              Send Invite
            </Button>
          </form>
          <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Invites send an email when SMTP is configured. Otherwise, the user account is pre-created and you can share the signup link manually.
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

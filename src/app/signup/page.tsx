import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/mailer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function SignUpPage(props: { searchParams: Promise<{ email?: string }> }) {
  const searchParams = await props.searchParams
  const defaultEmail = searchParams?.email || ''

  async function register(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    if (!name || !email || !password) return
    await connectDB()
    const existing = await User.findOne({ email })
    if (existing) return
    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({ name, email, passwordHash, role: 'member' })
    
    // Send welcome email
    try {
      await sendWelcomeEmail(email, name)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
    }
    
    redirect('/signin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">Create your account to join the club</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={register} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" type="email" placeholder="john@example.com" defaultValue={defaultEmail} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <a href="/signin" className="text-primary hover:underline">Sign in</a>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

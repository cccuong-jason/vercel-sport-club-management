import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')
  
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Football Club</CardTitle>
          <CardDescription className="text-center">Sign in to manage your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" variant="default">
            <a href="/api/auth/signin?callbackUrl=/dashboard">
              Sign in with Email
            </a>
          </Button>
          
          <Button asChild className="w-full" variant="outline">
            <a href="/api/auth/signin/google?callbackUrl=/dashboard" className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </a>
          </Button>

          <div className="text-center space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">New to the club?</p>
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
          
          <div className="text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">← Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

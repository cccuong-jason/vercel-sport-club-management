import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Football Club Management
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Manage your team, events, attendance, and funds in one place.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        {session ? (
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/signin">Sign In</Link>
          </Button>
        )}
      </div>
    </main>
  )
}

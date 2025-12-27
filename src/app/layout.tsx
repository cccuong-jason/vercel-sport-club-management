import './globals.css'
import type { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Providers from '@/components/Providers'
import { Toaster } from '@/components/ui/sonner'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

"use client"
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function UserMenu() {
  const { data } = useSession()
  const [open, setOpen] = useState(false)
  if (!data?.user) return null
  return (
    <div className="relative">
      <button className="rounded px-3 py-1 hover:bg-gray-100" onClick={() => setOpen(v => !v)}>
        {data.user.name}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded border bg-white shadow">
          <Link href="/dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">Dashboard</Link>
          <Link href="/team" className="block px-3 py-2 text-sm hover:bg-gray-50">Team</Link>
          <Link href="/events" className="block px-3 py-2 text-sm hover:bg-gray-50">Events</Link>
          <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
        </div>
      )}
    </div>
  )}

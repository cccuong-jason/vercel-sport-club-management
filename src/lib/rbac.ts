export type Role = 'admin' | 'member'

export function isAdmin(role?: Role | null) {
  return role === 'admin'
}


export type Placement = 1 | 2 | 3

export function placementPoints(p: Placement) {
  switch (p) {
    case 1: return 3
    case 2: return 2
    case 3: return 1
  }
}

export function tallyVotes(votes: Array<{ playerId: string, placement: Placement }>) {
  const map = new Map<string, { total: number, firsts: number, seconds: number, thirds: number }>()
  for (const v of votes) {
    const cur = map.get(v.playerId) || { total: 0, firsts: 0, seconds: 0, thirds: 0 }
    cur.total += placementPoints(v.placement)
    if (v.placement === 1) cur.firsts++
    if (v.placement === 2) cur.seconds++
    if (v.placement === 3) cur.thirds++
    map.set(v.playerId, cur)
  }
  return Array.from(map.entries()).map(([playerId, s]) => ({ playerId, ...s }))
}

export function sortWithTiebreakers(entries: Array<{ playerId: string, total: number, firsts: number, seconds: number, thirds: number }>) {
  return entries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.firsts !== a.firsts) return b.firsts - a.firsts
    if (b.seconds !== a.seconds) return b.seconds - a.seconds
    if (b.thirds !== a.thirds) return b.thirds - a.thirds
    return a.playerId.localeCompare(b.playerId)
  })
}

export function attendancePoint(status: 'present'|'absent'|'unexpected') {
  if (status === 'present') return 2
  if (status === 'absent') return 0
  return 0
}


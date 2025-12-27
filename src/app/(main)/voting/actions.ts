'use server'

import { connectDB } from '@/lib/db'
import { Vote } from '@/models/Vote'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { VoteSchema } from '@/lib/validators'
import { encryptSelections, decryptSelections } from '@/lib/crypto'
import { tallyVotes, sortWithTiebreakers } from '@/lib/scoring'
import { revalidatePath } from 'next/cache'
import { Event } from '@/models/Event'
import { createNotification } from '@/lib/notifications'

export async function submitVote(matchId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, message: 'Not authenticated' }
  await connectDB()
  const voter = await User.findOne({ email: session?.user?.email })
  if (!voter) return { success: false, message: 'User not found' }
  
  const vote = {
    first: String(formData.get('first') || ''),
    firstReasons: JSON.parse(String(formData.get('firstReasons') || '[]')),
    firstOtherReason: String(formData.get('firstOtherReason') || ''),
    
    second: String(formData.get('second') || ''),
    secondReasons: JSON.parse(String(formData.get('secondReasons') || '[]')),
    secondOtherReason: String(formData.get('secondOtherReason') || ''),
    
    third: String(formData.get('third') || ''),
    thirdReasons: JSON.parse(String(formData.get('thirdReasons') || '[]')),
    thirdOtherReason: String(formData.get('thirdOtherReason') || ''),
  }

  const parsed = VoteSchema.safeParse(vote)
  if (!parsed.success) return { success: false, message: 'Invalid vote data: ' + parsed.error.errors[0].message }
  
  if ([parsed.data.first, parsed.data.second, parsed.data.third].includes(String(voter._id))) {
    return { success: false, message: 'Cannot vote for yourself' }
  }

  const enc = encryptSelections(JSON.stringify(parsed.data))
  
  // We store all data in the encrypted field to maintain anonymity
  // The old 'reasons' and 'otherReason' fields are cleared
  await Vote.updateOne(
    { matchId, voterId: voter._id }, 
    { selectionsEnc: enc, reasons: [], otherReason: '' }, 
    { upsert: true }
  )
  
  revalidatePath(`/voting/${matchId}`)
  return { success: true, message: 'Vote submitted successfully' }
}

export async function announceResults(matchId: string) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  const event = await Event.findById(matchId).lean<any>()
  const votes = await Vote.find({ matchId }).lean<any>()
  const decoded: Array<{ playerId: string, placement: 1|2|3 }> = []
  
  for (const v of votes) {
    try {
      const obj = JSON.parse(decryptSelections(v.selectionsEnc))
      // obj now contains the new structure, but 'first', 'second', 'third' keys still exist at the top level
      if (obj.first) decoded.push({ playerId: obj.first, placement: 1 })
      if (obj.second) decoded.push({ playerId: obj.second, placement: 2 })
      if (obj.third) decoded.push({ playerId: obj.third, placement: 3 })
    } catch (e) {
      console.error('Failed to decrypt vote:', e)
    }
  }
  
  const tallied = tallyVotes(decoded)
  const results = sortWithTiebreakers(tallied)
  
  if (results.length > 0) {
    const winner = results[0]
    const winnerUser = await User.findById(winner.playerId).lean<any>()
    
    // Send MVP results to all members
    try {
      await createNotification(
        'all',
        `MVP Results announced for ${event?.title || 'Match'}. Winner: ${winnerUser?.name || 'Unknown'}`,
        'success',
        `/voting/${matchId}`
      )
    } catch (error) {
      console.error('Failed to send MVP results notifications:', error)
    }
  }
  
  revalidatePath(`/voting/${matchId}`)
  return { success: true, message: 'Results announced successfully' }
}

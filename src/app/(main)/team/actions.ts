'use server'

import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function addMember(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  await connectDB()
  const name = String(formData.get('name') || '')
  const email = String(formData.get('email') || '')
  const position = String(formData.get('position') || '')
  if (!email || !name) return { success: false, message: 'Missing name or email' }
  
  try {
    // Check if user already exists
    const existing = await User.findOne({ email })
    if (existing) return { success: false, message: 'User with this email already exists' }

    // Hash default password '123456'
    const hashedPassword = await bcrypt.hash('123456', 10)

    await User.create({ 
      name, 
      email, 
      role: 'member', 
      position, 
      status: 'active',
      passwordHash: hashedPassword
    })
    revalidatePath('/team')
    return { success: true, message: 'Member account created with default password (123456)' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Failed to add member' }
  }
}

export async function setRole(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  await connectDB()
  const userId = String(formData.get('userId'))
  const role = String(formData.get('role')) as 'admin'|'member'
  
  try {
    await User.updateOne({ _id: userId }, { role })
    revalidatePath('/team')
    return { success: true, message: 'Role updated successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to update role' }
  }
}

export async function setStatus(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  await connectDB()
  const userId = String(formData.get('userId'))
  const status = String(formData.get('status')) as 'active'|'inactive'|'unavailable'
  
  try {
    await User.updateOne({ _id: userId }, { status })
    revalidatePath('/team')
    return { success: true, message: 'Status updated successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to update status' }
  }
}

export async function updateMemberDetails(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  await connectDB()
  
  const userId = String(formData.get('userId'))
  const name = String(formData.get('name') || '')
  const email = String(formData.get('email') || '')
  const position = String(formData.get('position') || '')
  
  try {
    await User.updateOne(
      { _id: userId }, 
      { name, email, position }
    )
    revalidatePath('/team')
    return { success: true, message: 'Member details updated successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to update member details' }
  }
}

export async function removeMember(userId: string) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  await connectDB()
  
  try {
    await User.findByIdAndDelete(userId)
    revalidatePath('/team')
    return { success: true, message: 'Member removed successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to remove member' }
  }
}

export async function claimAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { success: false, message: 'Not authenticated' }
  await connectDB()
  const adminExists = await User.countDocuments({ role: 'admin' })
  if (adminExists > 0) return { success: false, message: 'Admin already exists' }
  
  try {
    await User.updateOne({ email: session.user.email }, { role: 'admin' })
    revalidatePath('/team')
    return { success: true, message: 'You are now an admin' }
  } catch (error) {
    return { success: false, message: 'Failed to claim admin' }
  }
}

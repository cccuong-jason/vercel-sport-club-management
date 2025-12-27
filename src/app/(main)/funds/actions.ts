'use server'

import { connectDB } from '@/lib/db'
import { PaymentRequest } from '@/models/PaymentRequest'
import { PaymentRecord } from '@/models/PaymentRecord'
import { User } from '@/models/User'
import { FundTransaction } from '@/models/FundTransaction'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

// --- Transactions ---

export async function addTransaction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  
  const type = String(formData.get('type'))
  const amount = parseFloat(String(formData.get('amount')))
  const date = new Date(String(formData.get('date')))
  const category = String(formData.get('category'))
  const reason = String(formData.get('reason'))
  const memberIdRaw = String(formData.get('memberId'))
  const memberId = memberIdRaw && memberIdRaw !== 'none' ? memberIdRaw : null

  try {
    await FundTransaction.create({
      type,
      amount,
      date,
      category,
      reason,
      memberId,
      createdBy: (session as any).user.id
    })

    revalidatePath('/funds')
    return { success: true, message: 'Transaction added successfully' }
  } catch (error) {
    console.error('Error adding transaction:', error)
    return { success: false, message: 'Failed to add transaction' }
  }
}

// --- Monthly Funds ---

export async function createMonthlyFund(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  
  const title = String(formData.get('title')) // e.g., "October 2023 Fund"
  const amount = parseFloat(String(formData.get('amount')))
  const dueDate = new Date(String(formData.get('dueDate')))
  
  try {
    // 1. Create Request
    const request = await PaymentRequest.create({
      type: 'monthly',
      title,
      amount,
      dueDate,
      createdBy: (session as any).user.id
    })
    
    // 2. Assign to all ACTIVE members
    const members = await User.find({ status: 'active', role: 'member' }).select('_id')
    const records = members.map(m => ({
      requestId: request._id,
      userId: m._id,
      amount,
      status: 'unpaid'
    }))
    
    if (records.length > 0) {
      await PaymentRecord.insertMany(records)
      
      // Notify all
      await createNotification(
        'all',
        `New Monthly Fund: ${title} ($${amount}). Due: ${dueDate.toLocaleDateString()}`,
        'info',
        '/funds?tab=monthly'
      )
    }
    
    revalidatePath('/funds')
    return { success: true, message: 'Monthly fund created successfully' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Failed to create monthly fund' }
  }
}

// --- Penalties ---

export async function assignPenalty(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  
  const userId = String(formData.get('userId'))
  const amount = parseFloat(String(formData.get('amount')))
  const reason = String(formData.get('reason'))
  
  try {
    const request = await PaymentRequest.create({
      type: 'penalty',
      title: reason,
      amount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days by default
      targetUserId: userId,
      createdBy: (session as any).user.id
    })
    
    await PaymentRecord.create({
      requestId: request._id,
      userId,
      amount,
      status: 'unpaid'
    })
    
    await createNotification(
      [userId],
      `You have been fined: ${reason} ($${amount})`,
      'warning',
      '/funds?tab=penalties'
    )
    
    revalidatePath('/funds')
    return { success: true, message: 'Penalty assigned successfully' }
  } catch (error) {
    return { success: false, message: 'Failed to assign penalty' }
  }
}

// --- Payments ---

export async function markRecordAsPaid(recordId: string) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  
  try {
    const record = await PaymentRecord.findById(recordId).populate('requestId')
    if (!record) return { success: false, message: 'Record not found' }
    if (record.status === 'paid') return { success: false, message: 'Already paid' }
    
    // 1. Create Fund Transaction (Revenue)
    const transaction = await FundTransaction.create({
      type: 'contribution',
      amount: record.amount,
      date: new Date(),
      category: record.requestId.type === 'monthly' ? 'Monthly Fee' : 'Penalty',
      reason: `${record.requestId.title}`,
      memberId: record.userId,
      createdBy: (session as any).user.id
    })
    
    // 2. Update Record
    record.status = 'paid'
    record.paidAt = new Date()
    record.transactionId = transaction._id
    await record.save()
    
    await createNotification(
      [record.userId.toString()],
      `Payment received: ${record.requestId.title}`,
      'success',
      '/funds'
    )
    
    revalidatePath('/funds')
    return { success: true, message: 'Marked as paid' }
  } catch (error) {
    return { success: false, message: 'Failed to mark as paid' }
  }
}

export async function sendReminders(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!isAdmin((session as any).role)) return { success: false, message: 'Unauthorized' }
  
  await connectDB()
  
  try {
    const request = await PaymentRequest.findById(requestId)
    const unpaidRecords = await PaymentRecord.find({ requestId, status: 'unpaid' })
    
    const userIds = unpaidRecords.map(r => r.userId.toString())
    
    if (userIds.length > 0) {
      await createNotification(
        userIds,
        `Reminder: Please pay ${request.title} ($${request.amount})`,
        'warning',
        '/funds'
      )
    }
    
    return { success: true, message: `Sent reminders to ${userIds.length} members` }
  } catch (error) {
    return { success: false, message: 'Failed to send reminders' }
  }
}

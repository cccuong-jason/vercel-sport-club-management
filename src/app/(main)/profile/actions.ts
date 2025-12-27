'use server'

import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { success: false, message: 'Not authenticated' }
  
  await connectDB()
  
  const name = String(formData.get('name') || '')
  const position = String(formData.get('position') || '')
  const phoneNumber = String(formData.get('phoneNumber') || '')
  const dateOfBirth = String(formData.get('dateOfBirth') || '')
  const citizenId = String(formData.get('citizenId') || '')
  
  const file = formData.get('avatar') as File
  let photoUrl = undefined

  if (file && file.size > 0) {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create directory if not exists
      const uploadDir = join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      
      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${(session as any).user.id}-${Date.now()}.${ext}`
      const filepath = join(uploadDir, filename)
      
      await writeFile(filepath, buffer)
      photoUrl = `/uploads/${filename}`
    } catch (error) {
      console.error('File upload failed:', error)
      return { success: false, message: 'Failed to upload avatar' }
    }
  }

  try {
    const updateData: any = { 
      name, 
      position, 
      phoneNumber, 
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      citizenId
    }
    
    if (photoUrl) {
      updateData.photoUrl = photoUrl
    }

    await User.updateOne(
      { email: session.user.email },
      updateData
    )
    revalidatePath('/profile')
    return { success: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Failed to update profile' }
  }
}

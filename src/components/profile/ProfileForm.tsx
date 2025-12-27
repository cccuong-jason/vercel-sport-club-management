'use client'

import { updateProfile } from '@/app/(main)/profile/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useRef, useState } from 'react'

interface ProfileFormProps {
  user: {
    _id: string
    name: string
    email: string
    position?: string
    phoneNumber?: string
    dateOfBirth?: string
    citizenId?: string
    photoUrl?: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photoUrl || null)

  const handleSubmit = async (formData: FormData) => {
    const result = await updateProfile(formData)
    if (result?.success) {
      toast.success(result.message)
    } else {
      toast.error(result?.message || 'Failed to update profile')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewUrl || ''} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <Label htmlFor="avatar" className="cursor-pointer text-sm text-blue-600 hover:underline">
                Change Avatar
              </Label>
              <Input 
                id="avatar" 
                name="avatar" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" defaultValue={user.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input name="position" defaultValue={user.position} placeholder="e.g., Forward" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input name="phoneNumber" defaultValue={user.phoneNumber} placeholder="0912345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input 
                name="dateOfBirth" 
                type="date" 
                defaultValue={user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizenId">Citizen ID</Label>
              <Input name="citizenId" defaultValue={user.citizenId} placeholder="ID Number" />
            </div>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  )
}

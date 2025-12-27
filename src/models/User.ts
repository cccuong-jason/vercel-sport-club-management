import { Schema, model, models } from 'mongoose'

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'inactive', 'unavailable'], default: 'active' },
  position: String,
  phoneNumber: String,
  dateOfBirth: Date,
  citizenId: String,
  photoUrl: String,
  passwordHash: String,
}, { timestamps: true })

export type IUser = {
  _id: string
  name: string
  email: string
  role: 'admin'|'member'
  position?: string
  phoneNumber?: string
  dateOfBirth?: Date
  citizenId?: string
  photoUrl?: string
  passwordHash?: string
  status?: string
}

// Ensure models is defined before accessing User
const Model = models?.User || model('User', UserSchema)
export const User = Model

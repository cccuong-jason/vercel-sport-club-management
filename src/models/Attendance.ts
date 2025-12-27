import { Schema, model, models } from 'mongoose'

const AttendanceSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'unexpected'], required: true },
  note: String,
  markedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

AttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true })

const Model = models?.Attendance || model('Attendance', AttendanceSchema)
export const Attendance = Model

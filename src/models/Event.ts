import { Schema, model, models } from 'mongoose'

const EventSchema = new Schema({
  type: { type: String, enum: ['training', 'match'], required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: String,
  endTime: String,
  location: String,
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rsvpOpen: { type: Boolean, default: true }
}, { timestamps: true })

const Model = models?.Event || model('Event', EventSchema)
export const Event = Model

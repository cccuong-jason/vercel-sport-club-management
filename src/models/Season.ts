import { Schema, model, models } from 'mongoose'

const SeasonSchema = new Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const Model = models?.Season || model('Season', SeasonSchema)
export const Season = Model

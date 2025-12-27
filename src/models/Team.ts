import { Schema, model, models } from 'mongoose'

const TeamSchema = new Schema({
  name: { type: String, required: true },
  managerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

const Model = models?.Team || model('Team', TeamSchema)
export const Team = Model

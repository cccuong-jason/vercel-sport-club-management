import { Schema, model, models } from 'mongoose'

const VoteSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  selectionsEnc: { type: String, required: true },
  reasons: [String],
  otherReason: String
}, { timestamps: true })

VoteSchema.index({ matchId: 1, voterId: 1 }, { unique: true })

const Model = models?.Vote || model('Vote', VoteSchema)
export const Vote = Model

import { Schema, model, models } from 'mongoose'

const MatchPaymentSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending', 'overdue', 'rejected'], default: 'pending' },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reference: String,
  adminNote: String,
  requestedAt: Date,
  confirmedAt: Date
}, { timestamps: true })

MatchPaymentSchema.index({ matchId: 1, userId: 1 }, { unique: true })

const Model = models?.MatchPayment || model('MatchPayment', MatchPaymentSchema)
export const MatchPayment = Model

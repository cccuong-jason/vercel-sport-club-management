import { Schema, model, models } from 'mongoose'

const FundTransactionSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  type: { type: String, enum: ['contribution', 'expense'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: String,
  reason: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  memberId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const Model = models?.FundTransaction || model('FundTransaction', FundTransactionSchema)
export const FundTransaction = Model

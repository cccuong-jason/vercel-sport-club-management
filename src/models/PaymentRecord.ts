import { Schema, model, models } from 'mongoose'

const PaymentRecordSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'PaymentRequest', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // Snapshot of amount due
  status: { type: String, enum: ['paid', 'unpaid', 'waived'], default: 'unpaid' },
  paidAt: Date,
  transactionId: { type: Schema.Types.ObjectId, ref: 'FundTransaction' }
}, { timestamps: true })

PaymentRecordSchema.index({ requestId: 1, userId: 1 }, { unique: true })

const Model = models?.PaymentRecord || model('PaymentRecord', PaymentRecordSchema)
export const PaymentRecord = Model

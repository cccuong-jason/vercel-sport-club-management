import { Schema, model, models } from 'mongoose'

const PaymentRequestSchema = new Schema({
  type: { type: String, enum: ['monthly', 'penalty', 'custom'], required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: Date,
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' }, // If null, applies to all active members (for monthly)
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

const Model = models?.PaymentRequest || model('PaymentRequest', PaymentRequestSchema)
export const PaymentRequest = Model

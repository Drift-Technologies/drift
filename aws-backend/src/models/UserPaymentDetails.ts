import mongoose from 'mongoose';

const userPaymentDetailsSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

export const UserPaymentDetails = mongoose.model('UserPaymentDetails', userPaymentDetailsSchema);
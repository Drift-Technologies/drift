import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  payment_method_id: { type: String, required: true },
  last4: { type: String, required: true },
  brand: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const userPaymentDetailsSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true, unique: true },
  payment_methods: [paymentMethodSchema],
  default_payment_method_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const UserPaymentDetails = mongoose.model('UserPaymentDetails', userPaymentDetailsSchema);
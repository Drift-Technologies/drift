import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user_id: { type: String, required: true },
  bus_route: { type: String, required: true },
  charge_amt: { type: Number, required: true },
  transaction_id: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  stripe_payment_id: { type: String, required: true }
});

export const Transaction = mongoose.model('Transaction', transactionSchema); 
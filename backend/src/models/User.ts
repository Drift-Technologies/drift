import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user_id: { type: String, default: uuidv4, required: true },
  password: { type: String, required: true }
});

export const User = mongoose.model('User', userSchema); 
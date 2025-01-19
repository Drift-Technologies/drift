import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';

export const getTransactionsByUserId = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    
    const transactions = await Transaction.find({ user_id })
      .sort({ timestamp: -1 }) // Sort by newest first
      .limit(10); // Limit to 10 most recent transactions
    
    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
}; 
import { Router } from 'express';
import { getTransactionsByUserId } from '../controllers/transactionController';

const router = Router();

router.get('/:user_id', getTransactionsByUserId);

export default router; 
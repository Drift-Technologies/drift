import { Router, RequestHandler } from 'express';
import { processPayment } from '../controllers/paymentController';

const router = Router();

router.post('/process', processPayment as RequestHandler);

export default router; 
import { Router, RequestHandler } from 'express';
import { processPayment, createCustomer } from '../controllers/paymentController';

const router = Router();

router.post('/process', processPayment as RequestHandler);
router.post('/create-customer', createCustomer as RequestHandler);

export default router; 
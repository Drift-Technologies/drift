import { Router, RequestHandler } from 'express';
import { processPayment, createCustomer, getPaymentMethods, setDefaultPaymentMethod } from '../controllers/paymentController';

const router = Router();

router.post('/process', processPayment as RequestHandler);
router.post('/create-customer', createCustomer as RequestHandler);
router.get('/methods/:user_id', getPaymentMethods as RequestHandler);
router.post('/set-default', setDefaultPaymentMethod as RequestHandler);

export default router; 
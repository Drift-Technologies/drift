import { Router, RequestHandler } from 'express';
import { createUser, deleteAllUsers } from '../controllers/userController';

const router = Router();

router.post('/', createUser as RequestHandler);
router.delete('/all', deleteAllUsers as RequestHandler);

export default router; 
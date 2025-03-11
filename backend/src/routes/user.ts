import { Router, RequestHandler } from 'express';
import { createUser, deleteAllUsers, getUserByName, login } from '../controllers/userController';

const router = Router();

router.post('/', createUser as RequestHandler);
router.post('/login', login as RequestHandler);
router.delete('/all', deleteAllUsers as RequestHandler);
router.get('/:username', getUserByName as RequestHandler);

export default router; 
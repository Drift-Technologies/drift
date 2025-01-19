import { Router, RequestHandler } from 'express';
import { createUser, deleteAllUsers, getUserByName } from '../controllers/userController';

const router = Router();

router.post('/', createUser as RequestHandler);
router.delete('/all', deleteAllUsers as RequestHandler);
router.get('/:username', getUserByName as RequestHandler);

export default router; 
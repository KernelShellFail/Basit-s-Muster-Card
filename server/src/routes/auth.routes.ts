import { Router } from 'express';
import { registerOwner, loginUser } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerOwner);
router.post('/login', loginUser);

export default router;

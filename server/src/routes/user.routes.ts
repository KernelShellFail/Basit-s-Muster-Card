import { Router } from 'express';
import { getUsers, saveUser, deleteUser } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { UserSchema } from '../schemas';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['owner', 'admin']));

router.get('/', getUsers);
router.post('/', validateBody(UserSchema), saveUser);
router.delete('/:uid', deleteUser);

export default router;

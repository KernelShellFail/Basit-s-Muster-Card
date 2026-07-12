import { Router } from 'express';
import { getLeaves, saveLeaveRequest } from '../controllers/leave.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { LeaveSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', getLeaves);
router.post('/', validateBody(LeaveSchema), saveLeaveRequest);

export default router;

import { Router } from 'express';
import { getAttendance, saveAttendance } from '../controllers/attendance.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AttendanceSchema } from '../schemas';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

router.get('/', getAttendance);
router.post('/', requireRole(['owner', 'admin', 'supervisor']), validateBody(z.array(AttendanceSchema)), saveAttendance);

export default router;

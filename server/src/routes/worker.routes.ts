import { Router } from 'express';
import { getWorkers, saveWorker, deleteWorker } from '../controllers/worker.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { WorkerSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', getWorkers);
router.post('/', requireRole(['owner', 'admin', 'supervisor']), validateBody(WorkerSchema), saveWorker);
router.delete('/:id', requireRole(['owner', 'admin']), deleteWorker);

export default router;

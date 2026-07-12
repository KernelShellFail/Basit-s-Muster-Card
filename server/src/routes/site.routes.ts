import { Router } from 'express';
import { getSites, saveSite, deleteSite } from '../controllers/site.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { SiteSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', getSites);
router.post('/', requireRole(['owner', 'admin']), validateBody(SiteSchema), saveSite);
router.delete('/:id', requireRole(['owner', 'admin']), deleteSite);

export default router;

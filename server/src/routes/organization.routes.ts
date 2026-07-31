import { Router } from 'express';
import { getOrganization, saveOrganization } from '../controllers/organization.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { OrganizationSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', getOrganization);
router.post('/', requireRole(['owner', 'admin']), validateBody(OrganizationSchema), saveOrganization);

export default router;

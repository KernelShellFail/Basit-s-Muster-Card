import { Router } from 'express';
import { getLabourSubmissions, saveLabourSubmission } from '../controllers/labourSubmission.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { LabourSubmissionSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/submissions', getLabourSubmissions);
router.post('/submissions', validateBody(LabourSubmissionSchema), saveLabourSubmission);

export default router;

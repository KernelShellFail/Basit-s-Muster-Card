import { Router } from 'express';
import { getDemoInfo } from '../controllers/meta.controller';

const router = Router();

router.get('/demo', getDemoInfo);

export default router;

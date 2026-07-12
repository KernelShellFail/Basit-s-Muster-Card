import { Router } from 'express';
import { getNotifications, markNotificationsRead } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/read', markNotificationsRead);

export default router;

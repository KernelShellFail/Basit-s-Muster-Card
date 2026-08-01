import { Router } from 'express';
import { getNotifications, markNotificationsRead, markNotificationRead, createNotification } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/read', markNotificationsRead);
router.post('/:id/read', markNotificationRead);

export default router;

import { Router } from 'express';
import { getNotifications, markNotificationsRead, markNotificationRead, createNotification } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/', requireRole(['owner', 'admin', 'supervisor']), createNotification);
router.post('/read', markNotificationsRead);
router.post('/:id/read', markNotificationRead);

export default router;

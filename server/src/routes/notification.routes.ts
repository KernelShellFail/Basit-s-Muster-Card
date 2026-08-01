import { Router } from 'express';
import { getNotifications, markNotificationsRead, markNotificationRead, createNotification, deleteNotification, deleteAllNotifications } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/', requireRole(['owner', 'admin', 'supervisor']), createNotification);
router.post('/read', markNotificationsRead);
router.delete('/', requireRole(['owner', 'admin', 'supervisor']), deleteAllNotifications);
router.post('/:id/read', markNotificationRead);
router.delete('/:id', requireRole(['owner', 'admin', 'supervisor']), deleteNotification);

export default router;

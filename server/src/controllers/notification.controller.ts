import { Response } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const notificationRepo = new NotificationRepository();

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const notifications = await notificationRepo.findAllByOrg(orgId || '');
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const markNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    await notificationRepo.markAllAsRead(orgId || '');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
};

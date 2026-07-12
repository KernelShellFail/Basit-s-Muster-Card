import { Response } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const notificationRepo = new NotificationRepository();

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await notificationRepo.findOrderedByCreatedAt();
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const markNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await notificationRepo.markAllAsRead();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
};

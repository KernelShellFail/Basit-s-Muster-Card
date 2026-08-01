import { Response } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const notificationRepo = new NotificationRepository();

const toCamel = (n: any) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  type: n.type,
  read: n.read,
  link: n.link || undefined,
  createdAt: n.created_at,
  organizationId: n.organization_id,
});

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const notifications = await notificationRepo.findAllByOrg(orgId || '');
    res.json(notifications.map(toCamel));
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

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const id = req.params.id as string;
    await notificationRepo.markAsRead(id, orgId || '');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
};

export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, type, link } = req.body;
    if (!title || !message || !type) {
      return res.status(400).json({ error: 'title, message, and type are required' });
    }
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await notificationRepo.create({
      id,
      title: String(title).slice(0, 255),
      message: String(message),
      type: String(type),
      read: false,
      link: link ? String(link) : undefined,
      created_at: new Date().toISOString(),
      organization_id: req.user?.organizationId
    });
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database create failed' });
  }
};

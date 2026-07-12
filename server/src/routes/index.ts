import { Router } from 'express';
import authRoutes from './auth.routes';
import orgRoutes from './organization.routes';
import userRoutes from './user.routes';
import workerRoutes from './worker.routes';
import siteRoutes from './site.routes';
import attendanceRoutes from './attendance.routes';
import paymentRoutes from './payment.routes';
import leaveRoutes from './leave.routes';
import notifRoutes from './notification.routes';
import chatRoutes from './chat.routes';
import labourRoutes from './labourSubmission.routes';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'UP' }));

router.use('/auth', authRoutes);
router.use('/organization', orgRoutes);
router.use('/users', userRoutes);
router.use('/workers', workerRoutes);
router.use('/sites', siteRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/notifications', notifRoutes);
router.use('/chat', chatRoutes);
router.use('/labour', labourRoutes);

export default router;

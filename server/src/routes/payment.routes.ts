import { Router } from 'express';
import { getPayments, savePayment, deletePayment } from '../controllers/payment.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { PaymentSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', getPayments);
router.post('/', requireRole(['owner', 'admin']), validateBody(PaymentSchema), savePayment);
router.delete('/:id', requireRole(['owner', 'admin']), deletePayment);

export default router;

import { Response } from 'express';
import { PaymentRepository, PaymentEntity } from '../repositories/payment.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const paymentRepo = new PaymentRepository();

export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payments = user.role === 'labour' && user.workerId
      ? await paymentRepo.findAllByWorker(user.workerId, user.organizationId)
      : await paymentRepo.findAllByOrg(user.organizationId);
    const formatted = payments.map(p => ({
      id: p.id,
      workerId: p.worker_id,
      workerName: p.worker_name,
      date: p.date,
      amount: p.amount ? parseFloat(p.amount as any) : 0,
      paymentType: p.payment_type,
      referenceNumber: p.reference_number,
      type: p.type,
      workerSignature: p.worker_signature,
      supervisorSignature: p.supervisor_signature,
      notes: p.notes
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const savePayment = async (req: AuthenticatedRequest, res: Response) => {
  const { id, workerId, workerName, date, amount, paymentType, referenceNumber, type, workerSignature, supervisorSignature, notes } = req.body;
  try {
    // Labour users may only record payments for their own worker profile.
    const effectiveWorkerId = req.user?.role === 'labour' ? req.user.workerId : workerId;
    if (req.user?.role === 'labour' && !effectiveWorkerId) {
      return res.status(403).json({ error: 'Labour users must have a linked worker profile' });
    }

    const paymentData: PaymentEntity = {
      id,
      worker_id: effectiveWorkerId,
      worker_name: workerName,
      date,
      amount,
      payment_type: paymentType,
      reference_number: referenceNumber,
      type,
      worker_signature: workerSignature,
      supervisor_signature: supervisorSignature,
      notes,
      organization_id: req.user?.organizationId
    };
    await paymentRepo.save(paymentData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

export const deletePayment = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const orgId = req.user?.organizationId;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const deleted = await paymentRepo.deleteByIdAndOrg(id, orgId);
    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

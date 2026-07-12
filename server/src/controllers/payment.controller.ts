import { Response } from 'express';
import { PaymentRepository, PaymentEntity } from '../repositories/payment.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const paymentRepo = new PaymentRepository();

export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await paymentRepo.findOrderedByDate();
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
    const paymentData: PaymentEntity = {
      id,
      worker_id: workerId,
      worker_name: workerName,
      date,
      amount,
      payment_type: paymentType,
      reference_number: referenceNumber,
      type,
      worker_signature: workerSignature,
      supervisor_signature: supervisorSignature,
      notes
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
  try {
    await paymentRepo.delete(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

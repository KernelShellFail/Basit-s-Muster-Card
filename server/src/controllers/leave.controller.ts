import { Response } from 'express';
import { LeaveRepository, LeaveEntity } from '../repositories/leave.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const leaveRepo = new LeaveRepository();

export const getLeaves = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leaves = await leaveRepo.findOrderedByCreatedAt();
    const formatted = leaves.map(l => ({
      id: l.id,
      workerId: l.worker_id,
      workerName: l.worker_name,
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      reason: l.reason,
      status: l.status,
      comment: l.comment,
      createdAt: l.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveLeaveRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id, workerId, workerName, leaveType, startDate, endDate, reason, status, comment, createdAt } = req.body;
  try {
    const leaveData: LeaveEntity = {
      id,
      worker_id: workerId,
      worker_name: workerName,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status,
      comment,
      created_at: createdAt || new Date().toISOString()
    };
    await leaveRepo.save(leaveData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

import { Response } from 'express';
import { LeaveRepository, LeaveEntity } from '../repositories/leave.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const leaveRepo = new LeaveRepository();

export const getLeaves = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leaves = user.role === 'labour' && user.workerId
      ? await leaveRepo.findAllByWorker(user.workerId)
      : await leaveRepo.findAllByOrg(user.organizationId);
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
    // Labour users may only request leave for their own worker profile.
    const effectiveWorkerId = req.user?.role === 'labour' ? req.user.workerId : workerId;
    if (req.user?.role === 'labour' && !effectiveWorkerId) {
      return res.status(403).json({ error: 'Labour users must have a linked worker profile' });
    }

    const leaveData: LeaveEntity = {
      id,
      worker_id: effectiveWorkerId,
      worker_name: workerName,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status,
      comment,
      created_at: createdAt || new Date().toISOString(),
      organization_id: req.user?.organizationId
    };
    await leaveRepo.save(leaveData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

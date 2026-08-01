import { Response } from 'express';
import { LabourSubmissionRepository, LabourSubmissionEntity } from '../repositories/labourSubmission.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const submissionRepo = new LabourSubmissionRepository();

export const getLabourSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subs = user.role === 'labour' && user.workerId
      ? await submissionRepo.findAllByWorker(user.workerId, user.organizationId)
      : await submissionRepo.findAllByOrg(user.organizationId);
    res.json(subs.map(row => ({
      id: row.id,
      workerId: row.worker_id,
      date: row.date,
      status: row.status,
      isNightShift: row.is_night_shift,
      overtimeHours: row.overtime_hours ? parseFloat(row.overtime_hours as any) : 0,
      timeIn: row.time_in,
      timeOut: row.time_out,
      remarks: row.remarks,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveLabourSubmission = async (req: AuthenticatedRequest, res: Response) => {
  const { id, workerId, date, status, isNightShift, overtimeHours, timeIn, timeOut, remarks, createdAt } = req.body;
  try {
    // Labour users may only submit claims for their own worker profile.
    const effectiveWorkerId = req.user?.role === 'labour' ? req.user.workerId : workerId;
    if (req.user?.role === 'labour' && !effectiveWorkerId) {
      return res.status(403).json({ error: 'Labour users must have a linked worker profile' });
    }

    const submissionData: LabourSubmissionEntity = {
      id,
      worker_id: effectiveWorkerId,
      date,
      status,
      is_night_shift: isNightShift || false,
      overtime_hours: overtimeHours || 0,
      time_in: timeIn,
      time_out: timeOut,
      remarks,
      created_at: createdAt || new Date().toISOString(),
      organization_id: req.user?.organizationId
    };
    await submissionRepo.save(submissionData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

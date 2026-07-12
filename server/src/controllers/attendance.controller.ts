import { Response } from 'express';
import { AttendanceRepository, AttendanceEntity } from '../repositories/attendance.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const attendanceRepo = new AttendanceRepository();

export const getAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await attendanceRepo.findAll();
    const formatted = records.map(a => ({
      id: a.id,
      workerId: a.worker_id,
      date: a.date,
      status: a.status,
      isNightShift: a.is_night_shift,
      overtimeHours: a.overtime_hours ? parseFloat(a.overtime_hours as any) : 0,
      timeIn: a.time_in,
      timeOut: a.time_out,
      gpsCoordinates: a.gps_coordinates,
      photoProof: a.photo_proof,
      supervisorId: a.supervisor_id,
      siteId: a.site_id,
      remarks: a.remarks
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const records = req.body;
  try {
    const entities: AttendanceEntity[] = records.map((rec: any) => ({
      id: rec.id,
      worker_id: rec.workerId,
      date: rec.date,
      status: rec.status,
      is_night_shift: rec.isNightShift || false,
      overtime_hours: rec.overtimeHours || 0,
      time_in: rec.timeIn,
      time_out: rec.timeOut,
      gps_coordinates: rec.gpsCoordinates,
      photo_proof: rec.photoProof,
      supervisor_id: rec.supervisorId,
      site_id: rec.siteId,
      remarks: rec.remarks
    }));

    await attendanceRepo.saveBatch(entities);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database batch update failed' });
  }
};

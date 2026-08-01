import { Response } from 'express';
import { WorkerRepository, WorkerEntity } from '../repositories/worker.repository';
import { SiteRepository } from '../repositories/site.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const workerRepo = new WorkerRepository();
const siteRepo = new SiteRepository();

const syncSiteCount = async (siteId?: string) => {
  if (siteId) {
    const activeCount = await workerRepo.countActiveWorkers(siteId);
    await siteRepo.updateWorkersCount(siteId, activeCount);
  }
};

export const getWorkers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?.organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let workers: WorkerEntity[];
    if (user.role === 'labour' && user.workerId) {
      const own = await workerRepo.findByIdAndOrg(user.workerId, user.organizationId);
      workers = own ? [own] : [];
    } else if (user.role === 'supervisor' && user.siteId) {
      workers = await workerRepo.findAllBySite(user.siteId, user.organizationId);
    } else {
      workers = await workerRepo.findAllByOrg(user.organizationId);
    }

    const formatted = workers.map(w => ({
      id: w.id,
      name: w.name,
      fatherName: w.father_name,
      gender: w.gender,
      dob: w.dob,
      phone: w.phone,
      emergencyContact: w.emergency_contact,
      address: w.address,
      village: w.village,
      district: w.district,
      state: w.state,
      pinCode: w.pin_code,
      aadhaar: w.aadhaar,
      pan: w.pan,
      bankName: w.bank_name,
      accountNumber: w.account_number,
      ifscCode: w.ifsc_code,
      upiId: w.upi_id,
      joiningDate: w.joining_date,
      trade: w.trade,
      department: w.department,
      skillLevel: w.skill_level,
      dailyWage: w.daily_wage ? parseFloat(w.daily_wage as any) : 0,
      overtimeRate: w.overtime_rate ? parseFloat(w.overtime_rate as any) : 0,
      currentSiteId: w.current_site_id,
      status: w.status,
      photo: w.photo,
      notes: w.notes,
      documents: [] // Kept for interface compatibility
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveWorker = async (req: AuthenticatedRequest, res: Response) => {
  const {
    id, name, fatherName, gender, dob, phone, emergencyContact,
    address, village, district, state, pinCode, aadhaar, pan,
    bankName, accountNumber, ifscCode, upiId, trade, department, skillLevel,
    dailyWage, overtimeRate, currentSiteId, status, photo, notes
  } = req.body;

  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const workerData: WorkerEntity = {
      id,
      name,
      father_name: fatherName,
      gender,
      dob,
      phone,
      emergency_contact: emergencyContact,
      address,
      village,
      district,
      state,
      pin_code: pinCode,
      aadhaar,
      pan,
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      upi_id: upiId,
      trade,
      department,
      skill_level: skillLevel,
      daily_wage: dailyWage,
      overtime_rate: overtimeRate,
      current_site_id: currentSiteId,
      status,
      photo,
      notes,
      organization_id: orgId
    };

    // Find original site assignment to handle changes
    const existing = await workerRepo.findByIdAndOrg(id, orgId);
    if (existing === null && await workerRepo.findById(id)) {
      return res.status(403).json({ error: 'Permission denied: worker belongs to another organization' });
    }
    const prevSiteId = existing?.current_site_id;

    await workerRepo.save(workerData);

    // Sync site count stats
    await syncSiteCount(currentSiteId);
    if (prevSiteId && prevSiteId !== currentSiteId) {
      await syncSiteCount(prevSiteId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

export const deleteWorker = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const orgId = req.user?.organizationId;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const existing = await workerRepo.findByIdAndOrg(id, orgId);
    const siteId = existing?.current_site_id;

    const deleted = await workerRepo.deleteByIdAndOrg(id, orgId);
    if (!deleted) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Sync site count stats
    if (siteId) {
      await syncSiteCount(siteId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

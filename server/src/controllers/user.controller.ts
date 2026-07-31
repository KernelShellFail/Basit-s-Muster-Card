import { Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const userRepo = new UserRepository();

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const users = await userRepo.findAllByOrg(orgId || '');
    res.json(users.map(u => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      siteId: u.site_id,
      organizationId: u.organization_id,
      workerId: u.worker_id
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveUser = async (req: AuthenticatedRequest, res: Response) => {
  const { uid, name, email, phone, role, siteId, password, workerId } = req.body;
  try {
    const hashedPassword = password ? hashPassword(password) : undefined;
    await userRepo.save({
      uid,
      name,
      email,
      phone,
      role,
      site_id: siteId,
      organization_id: req.user?.organizationId,
      password: hashedPassword,
      worker_id: workerId || null
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.params.uid as string;
  try {
    await userRepo.deleteByUid(uid);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

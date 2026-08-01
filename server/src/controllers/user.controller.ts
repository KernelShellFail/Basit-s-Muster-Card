import { Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const userRepo = new UserRepository();

// Roles staff management UI is permitted to create/assign.
const ASSIGNABLE_ROLES = ['admin', 'supervisor', 'labour'];

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const users = await userRepo.findAllByOrg(orgId || '');
    res.json(users.map(u => ({
      uid: u.uid,
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      siteId: u.site_id,
      organizationId: u.organization_id,
      workerId: u.worker_id,
      photo: u.photo
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveUser = async (req: AuthenticatedRequest, res: Response) => {
  const { uid, name, username, email, phone, role, siteId, password, workerId, photo } = req.body;
  const orgId = req.user?.organizationId;
  const requesterRole = req.user?.role;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const isNew = !uid || !(await userRepo.findByUidAndOrg(uid, orgId));

    // Per-org username uniqueness.
    if (username && username.trim()) {
      const existing = await userRepo.findByUsernameInOrg(username.trim(), orgId);
      if (existing && existing.uid !== uid) {
        return res.status(409).json({ error: `Username "${username}" is already taken` });
      }
    }

    // Role policy: never escalate via this endpoint.
    let effectiveRole = role;
    if (!isNew) {
      const existingUser = await userRepo.findByUidAndOrg(uid, orgId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Keep the existing role unless the requester is allowed to change it.
      effectiveRole = existingUser.role;
      // An admin may change roles between the assignable set; the owner may too,
      // but nobody may (re)assign 'owner' through this endpoint.
      if (role && role !== existingUser.role) {
        if (role === 'owner') {
          return res.status(403).json({ error: 'Owner role cannot be assigned through staff management' });
        }
        if (requesterRole !== 'owner' && !ASSIGNABLE_ROLES.includes(role)) {
          return res.status(403).json({ error: `Role "${role}" cannot be assigned by your role` });
        }
        effectiveRole = role;
      }
    } else {
      if (role === 'owner') {
        return res.status(403).json({ error: 'Owner accounts are created through registration' });
      }
      if (requesterRole !== 'owner' && !ASSIGNABLE_ROLES.includes(role)) {
        return res.status(403).json({ error: `Role "${role}" cannot be assigned by your role` });
      }
    }

    const hashedPassword = password ? hashPassword(password) : undefined;
    await userRepo.save({
      uid,
      name,
      username: username?.trim() || undefined,
      email,
      phone,
      role: effectiveRole,
      site_id: siteId,
      organization_id: orgId,
      password: hashedPassword,
      worker_id: workerId || null,
      photo: photo || null
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.params.uid as string;
  const orgId = req.user?.organizationId;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const deleted = await userRepo.deleteByUidAndOrg(uid, orgId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

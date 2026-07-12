import { Response } from 'express';
import { UserRepository, User } from '../repositories/user.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { SiteRepository } from '../repositories/site.repository';
import { verifyPassword, hashPassword } from '../db';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const userRepo = new UserRepository();
const orgRepo = new OrganizationRepository();
const siteRepo = new SiteRepository();

export const registerOwner = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, password, organizationName } = req.body;
  try {
    const ownerUid = `usr-owner-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    const defaultSiteId = `site-${Date.now()}`;
    const hashedPassword = hashPassword(password);

    // 1. Create Organization
    await orgRepo.save({
      id: orgId,
      name: organizationName,
      owner_id: ownerUid
    });

    // 2. Create Default Site
    await siteRepo.save({
      id: defaultSiteId,
      name: 'Headquarters / Main Site',
      address: 'Default company location',
      status: 'active',
      supervisor_id: ownerUid,
      workers_count: 0
    });

    // 3. Create User Profile
    const newUser: User = {
      uid: ownerUid,
      name,
      email,
      phone,
      role: 'owner',
      organization_id: orgId,
      site_id: defaultSiteId,
      password: hashedPassword
    };
    await userRepo.save(newUser);

    const token = signToken({
      uid: ownerUid,
      role: 'owner',
      siteId: defaultSiteId,
      organizationId: orgId
    });

    res.json({
      success: true,
      token,
      user: {
        uid: ownerUid,
        name,
        email,
        phone,
        role: 'owner',
        organizationId: orgId,
        siteId: defaultSiteId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Owner registration transaction failed' });
  }
};

export const loginUser = async (req: AuthenticatedRequest, res: Response) => {
  const { loginId, password } = req.body;
  try {
    const user = await userRepo.findByIdentifier(loginId);
    if (!user) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    if (user.password && !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Incorrect credentials password' });
    }

    const token = signToken({
      uid: user.uid,
      role: user.role,
      siteId: user.site_id,
      organizationId: user.organization_id
    });

    res.json({
      success: true,
      token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        siteId: user.site_id,
        organizationId: user.organization_id,
        workerId: user.worker_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server authentication pipeline failed' });
  }
};

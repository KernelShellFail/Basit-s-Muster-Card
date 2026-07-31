import { Response } from 'express';
import { OrganizationRepository } from '../repositories/organization.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const orgRepo = new OrganizationRepository();

export const getOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const org = orgId ? await orgRepo.findById(orgId) : null;
    res.json(org || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveOrganization = async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, logo, gstNumber, address, phone, email } = req.body;
  try {
    const orgId = req.user?.organizationId;
    if (orgId && id && id !== orgId) {
      return res.status(403).json({ error: 'You can only edit your own organization' });
    }
    await orgRepo.save({
      id: orgId || id,
      name,
      logo,
      gst_number: gstNumber,
      address,
      phone,
      email,
      owner_id: req.user?.uid
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
};

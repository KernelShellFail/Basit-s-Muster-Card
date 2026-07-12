import { Response } from 'express';
import { OrganizationRepository } from '../repositories/organization.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const orgRepo = new OrganizationRepository();

export const getOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const org = await orgRepo.findFirst();
    res.json(org || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveOrganization = async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, logo, gstNumber, address, phone, email, ownerId } = req.body;
  try {
    await orgRepo.save({
      id,
      name,
      logo,
      gst_number: gstNumber,
      address,
      phone,
      email,
      owner_id: ownerId
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
};

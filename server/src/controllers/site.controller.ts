import { Response } from 'express';
import { SiteRepository, SiteEntity } from '../repositories/site.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const siteRepo = new SiteRepository();

export const getSites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const sites = await siteRepo.findAllByOrg(orgId || '');
    res.json(sites.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      gpsCoordinates: s.gps_coordinates,
      status: s.status,
      supervisorId: s.supervisor_id,
      workersCount: s.workers_count ? parseInt(s.workers_count as any) : 0
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveSite = async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, address, gpsCoordinates, status, supervisorId, workersCount } = req.body;
  const orgId = req.user?.organizationId;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Reject attempts to overwrite a site owned by another organization.
    const existing = await siteRepo.findByIdAndOrg(id, orgId);
    if (!existing && await siteRepo.findById(id)) {
      return res.status(403).json({ error: 'Permission denied: site belongs to another organization' });
    }
    const siteData: SiteEntity = {
      id,
      name,
      address,
      gps_coordinates: gpsCoordinates,
      status,
      supervisor_id: supervisorId,
      workers_count: workersCount,
      organization_id: orgId
    };
    await siteRepo.save(siteData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

export const deleteSite = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const orgId = req.user?.organizationId;
  if (!orgId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const deleted = await siteRepo.deleteSiteCascade(id, orgId);
    if (!deleted) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

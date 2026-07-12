import { Response } from 'express';
import { SiteRepository, SiteEntity } from '../repositories/site.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const siteRepo = new SiteRepository();

export const getSites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sites = await siteRepo.findAll();
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
  try {
    const siteData: SiteEntity = {
      id,
      name,
      address,
      gps_coordinates: gpsCoordinates,
      status,
      supervisor_id: supervisorId,
      workers_count: workersCount
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
  try {
    await siteRepo.deleteSiteCascade(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database deletion failed' });
  }
};

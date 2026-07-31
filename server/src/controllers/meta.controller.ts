import { Request, Response } from 'express';
import { config, demoAccounts } from '../config';

// Public metadata endpoint used by the auth page to render demo credentials
// dynamically instead of hardcoding them in the client bundle.
export const getDemoInfo = (_req: Request, res: Response) => {
  if (!config.demo.enabled) {
    return res.json({ enabled: false, accounts: [] });
  }
  res.json({
    enabled: true,
    organizationName: config.demo.orgName,
    accounts: demoAccounts(),
  });
};

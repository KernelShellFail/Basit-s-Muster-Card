import { Router } from 'express';
import { registerOwner, loginUser } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/rateLimit';
import { RegisterSchema, LoginSchema } from '../schemas';
import { config } from '../config';

const router = Router();

router.post(
  '/register',
  rateLimit({ windowMs: config.rateLimit.registerWindowMs, max: config.rateLimit.registerMax }),
  validateBody(RegisterSchema),
  registerOwner
);
router.post(
  '/login',
  rateLimit({ windowMs: config.rateLimit.loginWindowMs, max: config.rateLimit.loginMax }),
  validateBody(LoginSchema),
  loginUser
);

export default router;

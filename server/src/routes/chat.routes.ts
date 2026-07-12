import { Router } from 'express';
import { getChatMessages, saveChatMessage } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { ChatMessageSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/:siteId', getChatMessages);
router.post('/', validateBody(ChatMessageSchema), saveChatMessage);

export default router;

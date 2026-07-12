import { Response } from 'express';
import { ChatRepository, ChatMessageEntity } from '../repositories/chat.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const chatRepo = new ChatRepository();

export const getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
  const siteId = req.params.siteId as string;
  try {
    const messages = await chatRepo.findBySiteId(siteId);
    const formatted = messages.map(c => ({
      id: c.id,
      siteId: c.site_id,
      senderId: c.sender_id,
      senderName: c.sender_name,
      senderRole: c.sender_role,
      text: c.text,
      imageUrl: c.image_url,
      createdAt: c.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
};

export const saveChatMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { id, siteId, senderId, senderName, senderRole, text, imageUrl, createdAt } = req.body;
  try {
    const msgData: ChatMessageEntity = {
      id,
      site_id: siteId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      text,
      image_url: imageUrl,
      created_at: createdAt || new Date().toISOString()
    };
    await chatRepo.save(msgData);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database saving failed' });
  }
};

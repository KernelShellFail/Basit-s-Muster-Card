import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  CheckCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { slideUp } from '../../utils/animations';

import { useSites, useChat, useSendChatMessage, useUsers } from '../../api/queries';
import { ChatMessage } from '../../services/db';

export const Chat = () => {
  const { 
    currentUser, 
    selectedRole, 
    activeSiteId 
  } = useAppStore();
  const { data: sites = [] } = useSites();
  const { data: users = [] } = useUsers();

  const [text, setText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'global' | 'site'>('global');
  
  const chatSiteId = activeChannel === 'global' ? 'global' : activeSiteId;
  const { data: chatMessages = [] } = useChat(chatSiteId);
  const { mutate: sendChatMessage } = useSendChatMessage();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      siteId: selectedRole === 'labour' || selectedRole === 'supervisor' ? activeSiteId : (activeChannel === 'global' ? 'global' : activeSiteId),
      senderId: currentUser?.uid || '',
      senderName: currentUser?.name || 'Anonymous User',
      senderRole: selectedRole,
      text,
      createdAt: new Date().toISOString()
    };

    sendChatMessage(message);
    setText('');

    setTimeout(() => {
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        const supervisor = users.find(u => u.role === 'supervisor') || users.find(u => u.role === 'admin');
        if (!supervisor) return;

        const acknowledgements = [
          `Received, ${currentUser?.name?.split(' ')[0] || 'there'}. Will verify and update the muster sheet.`,
          'Noted. I will check the site logs and get back to you.',
          'Thanks for the update. Keeping the records synced.'
        ];
        const replyText = acknowledgements[Math.floor(Math.random() * acknowledgements.length)];

        const botMessage = {
          id: `msg-bot-${Date.now()}`,
          siteId: selectedRole === 'labour' || selectedRole === 'supervisor' ? activeSiteId : (activeChannel === 'global' ? 'global' : activeSiteId),
          senderId: supervisor.uid,
          senderName: supervisor.name,
          senderRole: supervisor.role,
          text: replyText,
          createdAt: new Date().toISOString()
        };

        sendChatMessage(botMessage);
      }, 1200);

    }, 800);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  const getSiteName = () => {
    return sites.find(s => s.id === activeSiteId)?.name || 'My Site';
  };

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible" className="h-[calc(100dvh-12rem)] md:h-[calc(100vh-13rem)]">
      <div className="mb-6">
        <Eyebrow text="chat" color="text-blue" />
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[48px] font-semibold tracking-[-0.02em] leading-[1] text-surface-cream">Muster Team Chat</h1>
      </div>
      <Card className="h-full flex overflow-hidden p-0 border border-border">
        
        {/* Channels Sidebar List (Hidden for Labour role for simplicity) */}
        {selectedRole !== 'labour' && (
          <div className="w-64 border-r border-border bg-background flex flex-col p-5 space-y-5 shrink-0 hidden md:flex animate-fade-in">
            <h3 className="text-[11px] font-bold text-surface-50 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue" />
              Muster Channels
            </h3>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveChannel('global');
                }}
                className={`w-full text-left px-4 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  activeChannel === 'global'
                    ? 'bg-card border-blue/40 text-blue'
                    : 'text-surface-50 border-transparent hover:bg-card hover:text-surface-cream'
                }`}
              >
                # team-hq
              </button>

              <button
                onClick={() => {
                  setActiveChannel('site');
                }}
                className={`w-full text-left px-4 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border truncate ${
                  activeChannel === 'site'
                    ? 'bg-card border-blue/40 text-blue'
                    : 'text-surface-50 border-transparent hover:bg-card hover:text-surface-cream'
                }`}
              >
                # site-{activeSiteId.split('-')[1]} ({getSiteName().substring(0, 10)}...)
              </button>
            </div>
          </div>
        )}

        {/* Chat Conversation pane */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-background">
          {/* Header bar */}
          <div className="h-16 border-b border-border px-6 sm:px-8 flex items-center justify-between shrink-0 bg-card/65 backdrop-blur-md">
            <div>
              <h4 className="text-[12px] font-bold text-surface-cream uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fn-success pulse-dot"></span>
                {selectedRole === 'labour' ? `# site-${activeSiteId.split('-')[1]} team` : (activeChannel === 'global' ? '# team-hq' : `# site-${activeSiteId.split('-')[1]} room`)}
              </h4>
              <p className="text-[11px] text-surface-50 mt-1 uppercase tracking-widest font-bold hidden xs:block">Real-time team channel</p>
            </div>

            {/* Mobile Channel Switcher */}
            {selectedRole !== 'labour' && (
              <div className="flex md:hidden bg-background p-1 rounded-full border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel('global');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeChannel === 'global'
                      ? 'bg-card text-blue border border-blue/40'
                      : 'text-surface-50 hover:text-surface-cream'
                  }`}
                >
                  Org
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel('site');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeChannel === 'site'
                      ? 'bg-card text-blue border border-blue/40'
                      : 'text-surface-50 hover:text-surface-cream'
                  }`}
                >
                  Site
                </button>
              </div>
            )}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {chatMessages.length === 0 ? (
              <div className="text-center py-20 text-sm text-surface-50 font-semibold">
                No messages posted here yet. Start the conversation!
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.uid;
                
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-background text-surface-cream flex items-center justify-center font-bold text-xs shrink-0 border border-border uppercase">
                      {msg.senderName.substring(0, 2)}
                    </div>

                    <div className={`space-y-1 ${isMe ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                      <div className={`flex items-center gap-2 text-[11px] font-bold text-surface-50 uppercase tracking-wider ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{msg.senderName}</span>
                        <span className="bg-card px-1.5 py-0.5 rounded text-[11px] tracking-widest uppercase border border-border">
                          {msg.senderRole}
                        </span>
                      </div>

                      <div className={`p-4 rounded-[8px] text-[13px] font-semibold leading-relaxed border ${
                        isMe 
                          ? 'bg-blue/15 border-blue/40 text-surface-cream rounded-tr-sm' 
                          : 'bg-card text-surface-cream rounded-tl-sm border-border'
                      }`}>
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-surface-50 font-bold mt-1 uppercase tracking-wide">
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-4 h-4 text-fn-success" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3 max-w-sm"
              >
                <div className="w-9 h-9 rounded-full bg-background text-surface-cream flex items-center justify-center font-bold text-xs shrink-0 border border-border uppercase">
                  {(users.find(u => u.role === 'supervisor')?.name || 'ST').substring(0, 2)}
                </div>
                <div className="bg-card p-4 rounded-[8px] rounded-tl-sm border border-border text-[11px] text-surface-50 font-bold flex items-center gap-2 uppercase tracking-wider">
                  <span>{(users.find(u => u.role === 'supervisor')?.name || 'Supervisor')} typing</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-blue rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-blue rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-border bg-card/65 backdrop-blur-md shrink-0 flex items-center gap-3">
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              title="Attach documents"
              className="shrink-0 text-surface-50 h-11 w-11 hover:bg-muted"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Input
              type="text"
              placeholder="Type your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 h-11 text-xs"
            />

            <Button
              type="submit"
              size="icon"
              className="shrink-0 h-11 w-11 rounded-full"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>

        </div>
      </Card>
    </motion.div>
  );
};

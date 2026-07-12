import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  CheckCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { slideUp } from '../../utils/animations';

export const Chat = () => {
  const { 
    chatMessages, 
    sendChatMessage, 
    currentUser, 
    selectedRole, 
    activeSiteId, 
    sites, 
    currentLanguage 
  } = useAppStore();

  const { t } = useTranslation(currentLanguage);
  
  const [text, setText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'global' | 'site'>('global');
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

    sendChatMessage(text);
    setText('');

    setTimeout(() => {
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        const replies = [
          'Received, will verify that checklist.',
          'Scaffold check completed. Ready for concrete pouring.',
          'Material inventory matches. Logs updated.',
          'Double shift check-in finalized. Team moving to elevation track.',
          'Aadhaar KYC forms received from new Mason, uploading now.'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const botMessage = {
          id: `msg-bot-${Date.now()}`,
          siteId: selectedRole === 'labour' || selectedRole === 'supervisor' ? activeSiteId : (activeChannel === 'global' ? 'global' : activeSiteId),
          senderId: 'usr-super1',
          senderName: 'Satish Kamble',
          senderRole: 'supervisor' as any,
          text: randomReply,
          createdAt: new Date().toISOString()
        };

        const currentChat = localStorage.getItem('mm_chat') 
          ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
          : [];
        currentChat.push(botMessage);
        localStorage.setItem('mm_chat', JSON.stringify(currentChat));

        useAppStore.getState().refreshData();
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
    <motion.div variants={slideUp} initial="hidden" animate="visible" className="h-[calc(100vh-9rem)]">
      <Card glass className="h-full flex overflow-hidden p-0 border-border">
        
        {/* Channels Sidebar List (Hidden for Labour role for simplicity) */}
        {selectedRole !== 'labour' && (
          <div className="w-64 border-r border-border bg-accent/30 flex flex-col p-5 space-y-5 shrink-0 hidden md:flex">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Muster Channels
            </h3>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveChannel('global');
                  const globalChat = localStorage.getItem('mm_chat') 
                    ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                    : [];
                  useAppStore.setState({ chatMessages: globalChat.filter((c: any) => c.siteId === 'global') });
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeChannel === 'global'
                    ? 'bg-brand-500 text-brand-foreground shadow-md shadow-brand-500/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                # organization-wide-team
              </button>

              <button
                onClick={() => {
                  setActiveChannel('site');
                  const siteChat = localStorage.getItem('mm_chat') 
                    ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                    : [];
                  useAppStore.setState({ chatMessages: siteChat.filter((c: any) => c.siteId === activeSiteId) });
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all truncate ${
                  activeChannel === 'site'
                    ? 'bg-brand-500 text-brand-foreground shadow-md shadow-brand-500/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                # site-{activeSiteId.split('-')[1]} ({getSiteName().substring(0, 15)}...)
              </button>
            </div>
          </div>
        )}

        {/* Chat Conversation pane */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-background/50">
          {/* Header bar */}
          <div className="h-16 border-b border-border px-6 sm:px-8 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-md">
            <div>
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                {selectedRole === 'labour' ? `# site-${activeSiteId.split('-')[1]} team` : (activeChannel === 'global' ? '# organization-wide-team' : `# site-${activeSiteId.split('-')[1]} room`)}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-semibold hidden xs:block">Active thread with real-time replication</p>
            </div>

            {/* Mobile Channel Switcher */}
            {selectedRole !== 'labour' && (
              <div className="flex md:hidden bg-accent/50 p-1 rounded-xl border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel('global');
                    const globalChat = localStorage.getItem('mm_chat') 
                      ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                      : [];
                    useAppStore.setState({ chatMessages: globalChat.filter((c: any) => c.siteId === 'global') });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeChannel === 'global'
                      ? 'bg-brand-500 text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Org
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveChannel('site');
                    const siteChat = localStorage.getItem('mm_chat') 
                      ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                      : [];
                    useAppStore.setState({ chatMessages: siteChat.filter((c: any) => c.siteId === activeSiteId) });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeChannel === 'site'
                      ? 'bg-brand-500 text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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
              <div className="text-center py-20 text-sm text-muted-foreground font-medium">
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
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent text-foreground flex items-center justify-center font-black text-xs shrink-0 border border-border shadow-inner">
                      {msg.senderName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className={`space-y-1 ${isMe ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                      <div className={`flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{msg.senderName}</span>
                        <span className="bg-accent px-1.5 py-0.5 rounded text-[9px]">
                          {msg.senderRole}
                        </span>
                      </div>

                      <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm backdrop-blur-sm ${
                        isMe 
                          ? 'bg-brand-500 text-brand-foreground rounded-tr-sm shadow-brand-500/10' 
                          : 'bg-background text-foreground rounded-tl-sm border border-border'
                      }`}>
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold mt-1">
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-5 h-5 text-emerald-500" />}
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
                <div className="w-10 h-10 rounded-full bg-accent text-foreground flex items-center justify-center font-black text-xs shrink-0 border border-border">SK</div>
                <div className="bg-background p-4 rounded-2xl rounded-tl-sm border border-border text-xs text-muted-foreground font-semibold flex items-center gap-2 shadow-sm">
                  <span>Satish Kamble typing</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-border bg-background/80 backdrop-blur-md shrink-0 flex items-center gap-3">
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              title="Attach documents"
              className="shrink-0 text-muted-foreground"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <Input
              type="text"
              placeholder="Type your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 shadow-inner h-12"
            />

            <Button
              type="submit"
              size="icon"
              className="shrink-0 h-12 w-12 rounded-xl"
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>

        </div>
      </Card>
    </motion.div>
  );
};

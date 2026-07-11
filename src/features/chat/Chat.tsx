import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../utils/i18n';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MapPin, 
  MessageSquare, 
  UserSquare2, 
  CheckCheck,
  Check
} from 'lucide-react';

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

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle send message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendChatMessage(text);
    const sentText = text;
    setText('');

    // Simulate other supervisor reply after 2 seconds for rich user experience
    setTimeout(() => {
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        // Dispatch custom system-seeded automated reply
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

        // Trigger store sync
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
    <div className="h-[calc(100vh-8.5rem)] flex rounded-2xl border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-900 shadow-sm overflow-hidden">
      
      {/* Channels Sidebar List (Hidden for Labour role for simplicity) */}
      {selectedRole !== 'labour' && (
        <div className="w-56 md:w-64 border-r border-construction-200 dark:border-construction-800 bg-construction-50/50 dark:bg-construction-950/10 flex flex-col p-4 space-y-4 shrink-0">
          <h3 className="text-xs font-bold text-construction-450 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-safety-500" />
            Muster Channels
          </h3>
          
          <div className="flex flex-col gap-1.5">
            {/* Global Channel */}
            <button
              onClick={() => {
                setActiveChannel('global');
                // Sync chat to global channel
                const globalChat = localStorage.getItem('mm_chat') 
                  ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                  : [];
                useAppStore.setState({ chatMessages: globalChat.filter((c: any) => c.siteId === 'global') });
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeChannel === 'global'
                  ? 'bg-safety-500 text-construction-950 shadow-sm'
                  : 'text-construction-700 dark:text-construction-450 hover:bg-construction-100 dark:hover:bg-construction-800'
              }`}
            >
              # organization-wide-team
            </button>

            {/* Site Specific Channel */}
            <button
              onClick={() => {
                setActiveChannel('site');
                // Sync chat to active site
                const siteChat = localStorage.getItem('mm_chat') 
                  ? JSON.parse(localStorage.getItem('mm_chat') || '[]') 
                  : [];
                useAppStore.setState({ chatMessages: siteChat.filter((c: any) => c.siteId === activeSiteId) });
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all truncate ${
                activeChannel === 'site'
                  ? 'bg-safety-500 text-construction-950 shadow-sm'
                  : 'text-construction-700 dark:text-construction-450 hover:bg-construction-100 dark:hover:bg-construction-800'
              }`}
            >
              # site-{activeSiteId.split('-')[1]} ({getSiteName().substring(0, 15)}...)
            </button>
          </div>
        </div>
      )}

      {/* Chat Conversation pane */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/20 dark:bg-construction-950/10">
        {/* Header bar */}
        <div className="h-14 border-b border-construction-200 dark:border-construction-800 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-construction-900">
          <div>
            <h4 className="text-xs font-black text-construction-800 dark:text-white uppercase tracking-wider">
              {selectedRole === 'labour' ? `# site-${activeSiteId.split('-')[1]} team` : (activeChannel === 'global' ? '# organization-wide-team' : `# site-${activeSiteId.split('-')[1]} room`)}
            </h4>
            <p className="text-[9px] text-construction-500 mt-0.5">Active thread with real-time replication</p>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-20 text-xs text-construction-450 font-medium">
              No messages posted here yet. Start the conversation!
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMe = msg.senderId === currentUser?.uid;

              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-lg ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Sender Initial */}
                  <div className="w-8 h-8 rounded-full bg-construction-250 dark:bg-construction-800 text-construction-750 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 border border-construction-200">
                    {msg.senderName.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    {/* Sender name & Role */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-construction-450">
                      <span>{msg.senderName}</span>
                      <span className="uppercase text-[8px] bg-construction-100 dark:bg-construction-800 px-1 rounded">
                        {msg.senderRole}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-safety-500 text-construction-950 rounded-tr-none' 
                        : 'bg-white dark:bg-construction-900 text-construction-800 dark:text-construction-200 rounded-tl-none border border-construction-200/50 dark:border-construction-800/60'
                    }`}>
                      {msg.text}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[9px] text-construction-400 font-semibold mt-0.5">
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 max-w-sm">
              <div className="w-8 h-8 rounded-full bg-construction-200 text-construction-700 flex items-center justify-center font-bold text-xs shrink-0">SK</div>
              <div className="bg-white dark:bg-construction-900 p-3 rounded-2xl rounded-tl-none border border-construction-100/50 text-[10px] text-construction-500 font-semibold flex items-center gap-1">
                <span>Satish Kamble typing</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-construction-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-construction-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-construction-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="h-16 border-t border-construction-200 dark:border-construction-800 px-4 bg-white dark:bg-construction-900 flex items-center gap-2 shrink-0">
          <button 
            type="button"
            className="p-2 hover:bg-construction-100 dark:hover:bg-construction-800 text-construction-500 rounded-lg shrink-0"
            title="Attach documents"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>
          
          <input
            type="text"
            placeholder="Type your message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 text-xs px-3 py-2 border border-construction-200 dark:border-construction-800 bg-white dark:bg-construction-950 text-construction-850 dark:text-white rounded-xl focus:outline-none"
          />

          <button
            type="submit"
            className="p-2.5 rounded-xl bg-safety-500 hover:bg-safety-600 text-construction-950 shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};

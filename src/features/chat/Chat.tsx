import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Send,
  MessageSquare,
  CheckCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { slideUp } from '../../utils/animations';
import { isToday, isYesterday, format } from 'date-fns';

import { useSites, useChat, useSendChatMessage } from '../../api/queries';
import { ChatMessage } from '../../services/db';

// Org-level (team HQ) channel id. Matches GLOBAL_CHANNEL_ID on the server and
// is scoped to the caller's organization on every row.
const GLOBAL_CHANNEL_ID = 'global';

const MAX_MESSAGE_LENGTH = 2000;

export const Chat = () => {
  const {
    currentUser,
    selectedRole,
    activeSiteId
  } = useAppStore();
  const { data: sites = [] } = useSites();

  const [text, setText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'global' | 'site'>('global');

  const chatSiteId = activeChannel === 'global' ? GLOBAL_CHANNEL_ID : activeSiteId;
  const { data: chatMessages = [] } = useChat(chatSiteId);
  const { mutate: sendChatMessage } = useSendChatMessage();

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const [showNewBanner, setShowNewBanner] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    setShowNewBanner(false);
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isNearBottomRef.current = near;
    if (near) setShowNewBanner(false);
  };

  // Channel switch: jump straight to the bottom, no smooth scrolling.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    isNearBottomRef.current = true;
    setShowNewBanner(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSiteId]);

  // New messages arrive (polling): auto-scroll only if the user was already near
  // the bottom, otherwise surface the "New messages" pill. We use the pre-arrival
  // position tracked by onScroll (isNearBottomRef) because the DOM has already
  // grown by the time this effect runs, so a fresh distance calc would always
  // look "far" from the bottom.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setShowNewBanner(false);
    } else {
      setShowNewBanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  // Auto-grow the textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const submitMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      siteId: selectedRole === 'labour' || selectedRole === 'supervisor' ? activeSiteId : (activeChannel === 'global' ? GLOBAL_CHANNEL_ID : activeSiteId),
      senderId: currentUser?.uid || '',
      senderName: currentUser?.name || 'Anonymous User',
      senderRole: selectedRole,
      text: trimmed.slice(0, MAX_MESSAGE_LENGTH),
      createdAt: new Date().toISOString()
    };

    sendChatMessage(message);
    setText('');
    scrollToBottom();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  const getDateLabel = (isoString: string) => {
    const date = new Date(isoString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'd MMM yyyy');
  };

  const getSiteName = () => {
    return sites.find(s => s.id === activeSiteId)?.name || 'My Site';
  };

  const charCount = text.trim().length;

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex flex-col h-full min-h-0">
      <div className="mb-6 shrink-0">
        <Eyebrow text="chat" color="text-blue" />
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[48px] font-semibold tracking-[-0.02em] leading-[1] text-surface-cream">Muster Team Chat</h1>
      </div>
      <Card className="flex-1 min-h-0 flex overflow-hidden p-0 border border-border">

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
        <div className="flex-1 min-w-0 flex flex-col bg-background">
          {/* Header bar */}
          <div className="h-16 border-b border-border px-6 sm:px-8 flex items-center justify-between shrink-0 bg-card/65 backdrop-blur-md">
            <div>
              <h4 className="text-[12px] font-bold text-surface-cream uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fn-success pulse-dot"></span>
                {selectedRole === 'labour' ? `# site-${activeSiteId.split('-')[1]} team` : (activeChannel === 'global' ? '# team-hq' : `# site-${activeSiteId.split('-')[1]} room`)}
              </h4>
              <p className="text-[11px] text-surface-50 mt-1 uppercase tracking-widest font-bold hidden xs:block">Live · messages appear automatically</p>
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
          <div
            ref={containerRef}
            onScroll={handleScroll}
            data-lenis-prevent
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-6 sm:p-8"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center py-20 text-sm text-surface-50 font-semibold">
                No messages posted here yet. Start the conversation!
              </div>
            ) : (
              (() => {
                const rendered: React.ReactNode[] = [];
                let lastDateKey: string | null = null;
                let lastSenderId: string | null = null;
                chatMessages.forEach((msg, idx) => {
                  const dateKey = msg.createdAt?.slice(0, 10) || '';
                  if (dateKey && dateKey !== lastDateKey) {
                    rendered.push(
                      <div key={`date-${dateKey}-${idx}`} className="flex items-center gap-3 py-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-surface-50">{getDateLabel(msg.createdAt)}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    );
                    lastDateKey = dateKey;
                    lastSenderId = null;
                  }

                  const isMe = msg.senderId === currentUser?.uid;
                  const isNewRun = lastSenderId === null || msg.senderId !== lastSenderId;
                  lastSenderId = msg.senderId;

                  rendered.push(
                    <motion.div
                      key={msg.id}
                      initial={isNewRun ? { opacity: 0, y: 10 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''} ${isNewRun ? 'mt-6' : 'mt-1.5'}`}
                    >
                      {isNewRun ? (
                        <div className="w-9 h-9 rounded-full bg-background text-surface-cream flex items-center justify-center font-bold text-xs shrink-0 border border-border uppercase">
                          {msg.senderName.substring(0, 2)}
                        </div>
                      ) : (
                        <div className="w-9 shrink-0" />
                      )}

                      <div className={`space-y-1 ${isMe ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                        {isNewRun && (
                          <div className={`flex items-center gap-2 text-[11px] font-bold text-surface-50 uppercase tracking-wider ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span>{msg.senderName}</span>
                            <span className="bg-card px-1.5 py-0.5 rounded text-[11px] tracking-widest uppercase border border-border">
                              {msg.senderRole}
                            </span>
                          </div>
                        )}

                        <div className={`p-3 sm:p-4 rounded-[8px] text-[13px] font-semibold leading-relaxed whitespace-pre-wrap break-words border ${
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
                });
                return rendered;
              })()
            )}
          </div>

          {/* New messages pill */}
          <div className="relative shrink-0 h-0">
            <AnimatePresence>
              {showNewBanner && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute left-1/2 -top-14 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-blue text-background text-[12px] font-bold shadow-lg"
                >
                  New messages ↓
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 border-t border-border bg-card/65 backdrop-blur-md shrink-0 flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              placeholder="Type your message here…  (Enter to send, Shift+Enter for new line)"
              aria-label="Message"
              className="flex-1 resize-none overflow-y-auto min-h-[44px] max-h-[128px] custom-scrollbar rounded-[8px] border border-border bg-background px-4 py-3 text-[14px] font-medium text-surface-cream placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all duration-200"
            />

            <div className="flex items-center gap-2 shrink-0">
              {charCount > 0 && (
                <span className={`text-[10px] font-bold tabular-nums ${charCount >= MAX_MESSAGE_LENGTH ? 'text-fn-warning' : 'text-surface-50'}`}>
                  {charCount}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
              <Button
                type="submit"
                size="icon"
                className="shrink-0 h-11 w-11 rounded-full"
                disabled={charCount === 0}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </form>

        </div>
      </Card>
    </motion.div>
  );
};

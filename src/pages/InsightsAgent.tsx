/**
 * InsightsAgent page — Claude Code-style index for client_admin users.
 * Features: chat history sidebar, dynamic prompts, skeleton loading, clean metadata.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { agentChatStream } from '@/api/agentApi';
import type { AgentStreamEvent } from '@/api/agentApi';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Loader2, Sparkles, Bot, User, HelpCircle, Brain, CheckCircle2, ChevronDown,
  TrendingUp, BarChart3, ShoppingCart, Search, Share2, Check, Link as LinkIcon, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import MarkdownContent from '@/components/chat/MarkdownContent';
import ChatHistory, { type Conversation, loadConversations, saveConversations } from '@/components/chat/ChatHistory';
import { sharedConversationsApi } from '@/api/authApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  route?: string;
  latency?: number;
  stepCount?: number;
}

const ROUTE_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  question: { label: 'Insight', className: 'bg-primary/10 text-primary border-primary/20', icon: <HelpCircle size={10} /> },
  complex: { label: 'Agent Loop', className: 'bg-secondary/10 text-secondary border-secondary/20', icon: <Brain size={10} /> },
};

const SUGGESTED_PROMPTS = [
  { text: 'Spending overview this month', icon: TrendingUp, subtitle: 'See where your money goes' },
  { text: 'Compare this month vs last month', icon: BarChart3, subtitle: 'Period-over-period analysis' },
  { text: "What should I order for tomorrow?", icon: ShoppingCart, subtitle: 'AI-predicted quantities' },
  { text: 'Which products have highest spend?', icon: Search, subtitle: 'Top items by cost' },
];

export default function InsightsAgent() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  // Conversation management
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations(userId));
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const convs = loadConversations(userId);
    return convs.length > 0 ? convs[0].id : null;
  });
  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamSteps, setStreamSteps] = useState<AgentStreamEvent[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const displayName = user?.name || 'there';
  const hasMessages = messages.length > 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => { return () => { if (cleanupRef.current) cleanupRef.current(); }; }, []);
  useEffect(() => { saveConversations(userId, conversations); }, [conversations, userId]);
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  const updateConversation = useCallback((convId: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === convId ? updater(c) : c));
  }, []);

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(conversations.find(c => c.id !== id)?.id || null);
    }
  };

  const handleShareConversation = async () => {
    if (!activeConv || activeConv.messages.length === 0 || sharing) return;
    setSharing(true);
    try {
      const res = await sharedConversationsApi.share({
        title: activeConv.title,
        messages: activeConv.messages,
        agent_type: 'insights',
      });
      const shareUrl = `${window.location.origin}/shared/${res.data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {
      toast.error('Failed to share conversation');
    } finally {
      setSharing(false);
    }
  };

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Ensure we have an active conversation
    let convId = activeConvId;
    if (!convId) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: msg.slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConvId(convId);
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() };

    // Update title if first message
    updateConversation(convId, c => ({
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? msg.slice(0, 40) : c.title,
      updatedAt: new Date().toISOString(),
    }));

    setInput('');
    setLoading(true);
    setStreamSteps([]);

    const clientId = (user as Record<string, unknown>)?.client_id as string || '';
    const clientName = user?.name || 'Client';
    const start = performance.now();
    const msgId = `a-${Date.now()}`;
    let responseText = '';
    let routeValue = '';
    let stepCount = 0;

    const currentConvId = convId;

    cleanupRef.current = agentChatStream(
      { message: msg, channel: 'insights', client_id: clientId, client_name: clientName },
      (event) => {
        if (event.type === 'tool_start') { stepCount++; setStreamSteps(prev => [...prev, event]); }
        else if (event.type === 'tool_end') { setStreamSteps(prev => [...prev, event]); }
        else if (event.type === 'response') { responseText = event.message; routeValue = event.route || 'question'; }
        else if (event.type === 'error') { responseText = event.message || 'Something went wrong'; }
        else if (event.type === 'done') {
          const elapsed = Math.round(performance.now() - start);
          const assistantMsg: ChatMessage = {
            id: msgId, role: 'assistant',
            content: responseText || 'I processed your request but have no response to show.',
            timestamp: new Date().toISOString(),
            route: routeValue || 'question',
            latency: elapsed,
            stepCount: stepCount > 0 ? stepCount : undefined,
          };
          updateConversation(currentConvId, c => ({
            ...c,
            messages: [...c.messages, assistantMsg],
            updatedAt: new Date().toISOString(),
          }));
          setStreamSteps([]); setLoading(false); cleanupRef.current = null; inputRef.current?.focus();
        }
      },
      (error) => {
        const elapsed = Math.round(performance.now() - start);
        const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Stream failed');
        const errMsg: ChatMessage = {
          id: `e-${Date.now()}`, role: 'assistant',
          content: isNetworkError ? 'The AI agent service is currently unavailable. Please try again later.' : error.message || 'Something went wrong',
          timestamp: new Date().toISOString(), latency: elapsed,
        };
        updateConversation(currentConvId, c => ({
          ...c, messages: [...c.messages, errMsg], updatedAt: new Date().toISOString(),
        }));
        setStreamSteps([]); setLoading(false); cleanupRef.current = null; inputRef.current?.focus();
      }
    );
  };

  const handleStop = () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setStreamSteps([]); setLoading(false); inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const formatLatency = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex">
      {/* Chat History Sidebar */}
      <ChatHistory
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={setActiveConvId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!hasMessages ? (
          /* Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
            <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="font-playfair text-3xl md:text-4xl font-semibold text-foreground">
                {greeting}, {displayName}
              </h1>
              <p className="mt-3 text-muted-foreground text-sm font-rubik max-w-md mx-auto">
                Your procurement intelligence assistant
              </p>
            </div>

            {/* Suggested Prompt Cards — 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {SUGGESTED_PROMPTS.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.text}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-start gap-3 border border-border rounded-xl px-4 py-3.5 text-left hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all duration-200 bg-card"
                  >
                    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-foreground block">{prompt.text}</span>
                      <span className="text-xs text-muted-foreground">{prompt.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Input */}
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-900">
              <div className="relative flex items-center border border-border rounded-xl bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your procurement data..."
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground/60 font-rubik"
                  autoFocus
                />
                {loading ? (
                  <Button onClick={handleStop} size="icon" className="mr-2 h-9 w-9 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all">
                    <Square size={14} />
                  </Button>
                ) : (
                  <Button onClick={() => handleSend()} disabled={!input.trim()} size="icon" className="mr-2 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                    <Send size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Mode */
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
            {/* Chat header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary font-rubik">Farmaze Insights</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareConversation}
                disabled={sharing || messages.length === 0}
                className="h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1.5"
              >
                {sharing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : shareSuccess ? (
                  <Check size={14} className="text-primary" />
                ) : (
                  <Share2 size={14} />
                )}
                <span className="text-xs">{shareSuccess ? 'Copied!' : 'Share'}</span>
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
              <div className="space-y-4 pb-4">
                {messages.map((msg: ChatMessage) => {
                  const isUser = msg.role === 'user';
                  const routeInfo = msg.route ? ROUTE_META[msg.route] : null;

                  return (
                    <div key={msg.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        {isUser ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={cn('flex-1 max-w-[85%]', isUser && 'flex flex-col items-end')}>
                        <div className={cn('text-sm', isUser ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5' : 'bg-card border border-border rounded-xl p-4')}>
                          {isUser ? <p>{msg.content}</p> : <MarkdownContent content={msg.content} />}
                        </div>
                        {/* Clean metadata line */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.latency != null && (
                            <>
                              <span className="text-[11px] text-muted-foreground/50">·</span>
                              <span className="text-[11px] text-muted-foreground">{formatLatency(msg.latency)}</span>
                            </>
                          )}
                          {routeInfo && (
                            <>
                              <span className="text-[11px] text-muted-foreground/50">·</span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium inline-flex items-center gap-0.5', routeInfo.className)}>
                                {routeInfo.icon} {routeInfo.label}
                              </span>
                            </>
                          )}
                          {msg.stepCount != null && msg.stepCount > 0 && (
                            <>
                              <span className="text-[11px] text-muted-foreground/50">·</span>
                              <button onClick={() => setExpandedSteps(expandedSteps === msg.id ? null : msg.id)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                                {msg.stepCount} step{msg.stepCount > 1 ? 's' : ''}
                                <ChevronDown size={10} className={cn('transition-transform', expandedSteps === msg.id && 'rotate-180')} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading State — Skeleton shimmer */}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot size={16} className="text-muted-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 flex-1 max-w-[85%]">
                      {streamSteps.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {streamSteps.reduce<{ tool: string; label: string; done: boolean }[]>((acc, step) => {
                            if (step.type === 'tool_start') acc.push({ tool: step.tool || '', label: step.message, done: false });
                            else if (step.type === 'tool_end') { const match = acc.find((s) => s.tool === step.tool && !s.done); if (match) match.done = true; }
                            return acc;
                          }, []).map((step, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {step.done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
                              <span className={step.done ? 'text-muted-foreground/70' : ''}>{step.label}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                            <span>Composing response...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="h-3 bg-muted animate-pulse rounded-md w-3/4" />
                          <div className="h-3 bg-muted animate-pulse rounded-md w-1/2" />
                          <div className="h-3 bg-muted animate-pulse rounded-md w-2/3" />
                          <p className="text-xs text-muted-foreground italic mt-2">Analyzing your data...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input bar — fixed bottom */}
            <div className="border-t border-border pt-3 mt-2">
              <div className="relative flex items-center border border-border rounded-xl bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your procurement data..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 font-rubik"
                />
                {loading ? (
                  <Button onClick={handleStop} size="icon" className="mr-2 h-9 w-9 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all">
                    <Square size={14} />
                  </Button>
                ) : (
                  <Button onClick={() => handleSend()} disabled={!input.trim()} size="icon" className="mr-2 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                    <Send size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

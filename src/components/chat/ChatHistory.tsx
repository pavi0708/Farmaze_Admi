/**
 * ChatHistory — Conversation sidebar for InsightsAgent (like Claude).
 */
import { useState } from 'react';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Conversation {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function loadConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(`farmaze_chat_history_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveConversations(userId: string, conversations: Conversation[]) {
  try {
    localStorage.setItem(`farmaze_chat_history_${userId}`, JSON.stringify(conversations.slice(0, 30)));
  } catch {}
}

export default function ChatHistory({ conversations, activeConversationId, onSelectConversation, onNewConversation, onDeleteConversation }: ChatHistoryProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-12 border-r border-border bg-card/50 flex flex-col items-center py-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNewConversation} className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewConversation} className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 px-3">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm transition-colors group flex items-start gap-2',
                activeConversationId === conv.id
                  ? 'bg-primary/5 border-l-2 border-primary'
                  : 'hover:bg-muted/50 border-l-2 border-transparent'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate text-sm leading-tight">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(conv.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

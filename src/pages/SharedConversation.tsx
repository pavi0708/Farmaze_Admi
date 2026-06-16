/**
 * SharedConversation — Authenticated page for viewing a shared agent conversation.
 * Only the owning client or admins can view. Accessed via /shared/:token (behind ProtectedRoute).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bot, User, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownContent from '@/components/chat/MarkdownContent';
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

interface SharedConversationData {
  id: string;
  share_token: string;
  client_name: string;
  title: string;
  messages: ChatMessage[];
  agent_type: string;
  created_at: string;
}

export default function SharedConversation() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    sharedConversationsApi.getByToken(token)
      .then(res => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 403) {
          setError('You do not have permission to view this conversation.');
        } else {
          setError('This conversation link is invalid or has expired.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Cannot View Conversation</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/" className="text-primary hover:underline text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const agentLabel = data.agent_type === 'procurement' ? 'Procurement Agent' : 'Farmaze Insights';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary">{agentLabel}</span>
            <span className="text-muted-foreground/50 mx-1">·</span>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{data.title}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Shared {new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            {data.client_name && ` by ${data.client_name}`}
          </span>
        </div>
      </div>

      {/* Messages */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {data.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs',
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn('flex-1 max-w-[85%]', isUser && 'flex flex-col items-end')}>
                  <div className={cn(
                    'text-sm',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
                      : 'bg-card border border-border rounded-xl p-4'
                  )}>
                    {isUser ? <p>{msg.content}</p> : <MarkdownContent content={msg.content} />}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

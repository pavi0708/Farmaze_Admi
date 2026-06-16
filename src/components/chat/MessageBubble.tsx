import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, RotateCcw, Edit, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from './ChatInterface';

interface MessageBubbleProps {
  message: Message;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLike,
  onDislike,
  onRegenerate,
  onEdit
}) => {
  const isUser = message.sender === 'user';
  const isSmartOrder = message.functionCall?.name === 'smart_order';

  const formatContent = (content: string) => {
    // Strip HTML comments (e.g. <!-- ORDER_DATA: {...} -->) before rendering
    const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
    // Handle markdown-like formatting
    const lines = cleaned.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-foreground mb-2 mt-4 first:mt-0">
            {line.substring(3)}
          </h3>
        );
      }
      
      // Bold text
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="font-semibold text-foreground mb-2">
            {line.substring(2, line.length - 2)}
          </p>
        );
      }
      
      // List items
      if (line.match(/^\d+\./)) {
        return (
          <div key={index} className="mb-1 ml-4">
            <span className="text-foreground">{line}</span>
          </div>
        );
      }
      
      // Sub-items (indented)
      if (line.match(/^\s+Option \d+:/)) {
        return (
          <div key={index} className="mb-1 ml-8 text-sm text-muted-foreground">
            {line.trim()}
          </div>
        );
      }
      
      // Bullet points
      if (line.startsWith('- ')) {
        return (
          <div key={index} className="mb-1 ml-4">
            <span className="text-foreground">{line.substring(2)}</span>
          </div>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Regular text
      return (
        <p key={index} className="text-foreground mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className={cn(
      "flex gap-4 max-w-4xl",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "p-4 max-w-3xl",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted/50 border-border/50",
          isSmartOrder && "bg-gradient-to-br from-green-50 to-blue-50 border-green-200 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800/30"
        )}>
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "prose-invert" : ""
          )}>
            {isSmartOrder ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Smart Order Analysis
                  </span>
                </div>
                {formatContent(message.content)}
              </div>
            ) : (
              formatContent(message.content)
            )}
          </div>
          
          {/* Timestamp */}
          <div className={cn(
            "text-xs mt-3 pt-2 border-t",
            isUser 
              ? "text-primary-foreground/70 border-primary-foreground/20" 
              : "text-muted-foreground border-border/30"
          )}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </Card>

        {/* Action buttons for assistant messages */}
        {!isUser && (
          <div className="flex gap-1 ml-2">
            {onLike && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(message.id)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
            )}
            {onDislike && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDislike(message.id)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate(message.id)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Action buttons for user messages */}
        {isUser && onEdit && (
          <div className="flex gap-1 mr-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(message.id)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

/**
 * ChatInterface — AI chat widget powered by farmaze-agent (Phase G).
 *
 * Sends messages to the unified /chat endpoint which auto-routes
 * between Procurement Agent (orders) and Insights Agent (questions).
 * Replaces the previous OpenAI + MCP WebSocket architecture.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import OrderPreview from './OrderPreview';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { agentChat } from '@/api/agentApi';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  route?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface ChatInterfaceProps {
  isWidget?: boolean;
  isExpanded?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isWidget = false, isExpanded = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [retryOperation, setRetryOperation] = useState<(() => void) | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: isWidget
          ? "Hi! I'm your AI procurement assistant. I can help with orders, check forecasts, compare suppliers, and more. What can I help you with?"
          : "Hi! I'm your AI assistant. I can help you create orders, check prices, and answer questions about your procurement. Try: 'Order tomato 5kg, paneer 2kg'.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleLike = (messageId: string) => {
    console.log('Liked message:', messageId);
  };

  const handleDislike = (messageId: string) => {
    console.log('Disliked message:', messageId);
  };

  const handleRegenerate = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.sender === 'user') {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        handleSendMessage(userMessage.content);
      }
    }
  };

  const handleEdit = (messageId: string) => {
    toast({
      title: "Edit message",
      description: "Message editing will be implemented soon.",
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setLastError(null);

    const retryFn = () => {
      setMessages(prev => prev.slice(0, -1));
      handleSendMessage(content);
    };
    setRetryOperation(() => retryFn);

    try {
      // Single HTTP call to farmaze-agent — handles all reasoning + tool calls
      const res = await agentChat({
        message: content,
        client_id: (user as Record<string, unknown>)?.client_id as string || '',
        client_name: (user as any)?.business_name || (user as any)?.username || user?.name || 'Client',
        channel: 'dashboard',
      });

      const data = res.data;

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I processed your request but have no response to show.',
        sender: 'assistant',
        timestamp: new Date(),
        route: data.route,
      };

      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      console.error('Agent chat error:', error);
      const err = error instanceof Error ? error : new Error('Failed to reach AI agent');
      setLastError(err);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (currentOrder.length === 0) {
      toast({ title: "No items to order", description: "Please add some items to your order first." });
      return;
    }

    try {
      currentOrder.forEach(item => {
        addToCart({
          id: item.productId,
          name: item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
          unit: item.unit,
          category: '',
          availability: 'in_stock',
        });
      });

      setCurrentOrder([]);
      toast({
        title: "Items added to cart",
        description: `Added ${currentOrder.length} items to your cart.`,
      });

      const confirmMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `✅ Added ${currentOrder.length} items to your cart. Review and place the order from the cart section.`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({ title: "Error", description: "Failed to add items to cart." });
    }
  };

  const handleClearOrder = () => {
    setCurrentOrder([]);
    toast({ title: "Order Cleared", description: "Current order has been cleared" });
  };

  const handleResetConversation = () => {
    const welcomeMessage: Message = {
      id: '1',
      content: isWidget
        ? "Hi! I'm your AI procurement assistant. What can I help you with?"
        : "Hi! I'm your AI assistant. Try: 'Order tomato 5kg, paneer 2kg'.",
      sender: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setCurrentOrder([]);
    setLastError(null);
    toast({ title: "Conversation Reset", description: "Chat history has been cleared" });
  };

  const total = currentOrder.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className={cn("flex flex-col h-full", "w-full max-w-none")}>

      {/* Messages area */}
      <div className="flex-1 min-h-0 bg-gradient-to-b from-background to-muted/20">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className={cn(
            "space-y-6 pb-8",
            isWidget && !isExpanded ? "px-6 py-6" : "px-8 py-6 max-w-6xl mx-auto"
          )}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onLike={handleLike}
                onDislike={handleDislike}
                onRegenerate={handleRegenerate}
                onEdit={handleEdit}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 bg-muted/80 backdrop-blur-sm px-6 py-4 rounded-2xl max-w-xs border border-border/50">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Error display */}
      {lastError && (
        <div className="mx-6 mb-4">
          <Card className="border-destructive/50 bg-destructive/5 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive">Something went wrong</h4>
                  <p className="text-sm text-muted-foreground mt-1">{lastError.message}</p>
                  {retryOperation && (
                    <Button variant="outline" size="sm" onClick={retryOperation} className="mt-3">
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Current order preview */}
      {currentOrder.length > 0 && (
        <div className="mx-6 mb-4">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Smart Order Preview</h4>
              </div>
              <OrderPreview
                items={currentOrder}
                total={total}
                onConfirm={handleConfirmOrder}
                onClear={handleClearOrder}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              placeholder="Try: 'Order tomato 5kg, paneer 2kg' or 'What did I spend this month?'"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetConversation}
            className="shrink-0 h-10 w-10"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

import React, { useState } from 'react';
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';

interface FloatingChatProps {
  className?: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        isFullscreen 
          ? "inset-0 p-4" 
          : "bottom-4 right-4",
        className
      )}>
        {/* Chat Toggle Button */}
        {!isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleChat}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Smart Order Assistant</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card className={cn(
            "shadow-2xl transition-all duration-300 ease-in-out",
            isFullscreen 
              ? "w-full h-full" 
              : "w-96 h-[600px]",
            "flex flex-col"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Smart Order Assistant</h3>
                  <p className="text-xs opacity-90">AI-powered ordering</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleChat}
                      className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close chat</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 min-h-0">
              <ChatInterface isWidget={true} isExpanded={isFullscreen} />
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

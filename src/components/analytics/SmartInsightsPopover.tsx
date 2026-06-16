import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Loader2, Sparkles } from "lucide-react";

interface SmartInsight {
  type: "positive" | "warning" | "negative";
  title: string;
  description: string;
  metric?: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  confidence?: number;
}

interface SmartInsightsPopoverProps {
  tabType: "overview" | "spend" | "volume";
  analyticsData: any;
  isDataLoaded: boolean;
  onGenerateInsights: (data: any) => Promise<SmartInsight[]>;
}

export default function SmartInsightsPopover({ 
  tabType, analyticsData, isDataLoaded, onGenerateInsights 
}: SmartInsightsPopoverProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerateInsights = async () => {
    if (!isDataLoaded || !analyticsData) return;
    setIsGenerating(true);
    try {
      const generatedInsights = await onGenerateInsights(analyticsData);
      setInsights(generatedInsights);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: SmartInsight["type"]) => {
    switch (type) {
      case "positive": return <TrendingUp className="h-4 w-4 text-primary" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-secondary" />;
      case "negative": return <TrendingDown className="h-4 w-4 text-secondary" />;
    }
  };

  const getInsightStyles = (type: SmartInsight["type"]) => {
    switch (type) {
      case "positive": return "border-l-primary bg-primary/5";
      case "warning": return "border-l-secondary bg-secondary/5";
      case "negative": return "border-l-secondary bg-secondary/5";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH": return "bg-secondary/10 text-secondary";
      case "MEDIUM": return "bg-primary/10 text-primary";
      case "LOW": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTabTitle = () => {
    switch (tabType) {
      case "overview": return "Overview Insights";
      case "spend": return "Spend Insights";
      case "volume": return "Volume Insights";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isDataLoaded || isGenerating} onClick={handleGenerateInsights} className="flex items-center gap-2">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? "Generating..." : "Smart Insights"}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 shadow-lg border-0" align="end" side="bottom" sideOffset={8}>
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{getTabTitle()}</span>
              <Badge variant="secondary" className="text-xs ml-auto">AI Generated</Badge>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {insights.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Click "Smart Insights" to generate AI-powered recommendations
                </div>
              ) : (
                insights.slice(0, 4).map((insight, index) => (
                  <div key={index} className={`border-l-4 pl-3 py-2 rounded-r ${getInsightStyles(insight.type)}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <span className="font-medium text-sm">{insight.title}</span>
                      </div>
                      <Badge className={`${getImpactColor(insight.impact)} text-xs px-1.5 py-0.5`}>{insight.impact}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{insight.description}</p>
                    {insight.metric && <div className="text-xs font-medium text-primary">{insight.metric}</div>}
                    {insight.confidence && <div className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(insight.confidence * 100)}%</div>}
                  </div>
                ))
              )}
            </div>

            {insights.length > 0 && (
              <div className="pt-3 mt-3 border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                  Insights generated from current {tabType} data
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

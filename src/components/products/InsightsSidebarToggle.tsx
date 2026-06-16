
import React from "react";
import { Button } from "@/components/ui/button";
import { BellDot } from "lucide-react";

interface InsightsSidebarToggleProps {
  onClick: () => void;
  insightsCount: number;
}

const InsightsSidebarToggle: React.FC<InsightsSidebarToggleProps> = ({ 
  onClick,
  insightsCount
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed right-6 top-24 bg-white border border-gray-200 rounded-lg py-3 px-4 shadow-md z-30 hover:bg-farmaze-orange/10 transition-colors group"
    >
      <div className="flex items-center space-x-2">
        <BellDot className="text-farmaze-orange group-hover:text-rose-500 transition-colors" size={20} />
        <div className="flex flex-col text-sm leading-tight font-medium">
          <span >Market Insights</span>
        </div>
        {insightsCount > 0 && (
          <div className="bg-farmaze-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {insightsCount}
          </div>
        )}
      </div>
    </Button>
  );
};

export default InsightsSidebarToggle;

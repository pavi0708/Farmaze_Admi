
import React from "react";
import { Button } from "@/components/ui/button";

interface AnalyticsViewToggleProps {
  activeView: "consumption" | "expenses";
  setActiveView: React.Dispatch<React.SetStateAction<"consumption" | "expenses">>;
}

const AnalyticsViewToggle: React.FC<AnalyticsViewToggleProps> = ({ 
  activeView, 
  setActiveView 
}) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={activeView === "consumption" ? "default" : "outline"}
        onClick={() => setActiveView("consumption")}
        className={activeView === "consumption" ? "bg-[#F16870] hover:bg-[#F16870]/90" : ""}
        size="sm"
      >
        Consumption
      </Button>
      <Button 
        variant={activeView === "expenses" ? "default" : "outline"}
        onClick={() => setActiveView("expenses")}
        className={activeView === "expenses" ? "bg-[#F16870] hover:bg-[#F16870]/90" : ""}
        size="sm"
      >
        Expenses
      </Button>
    </div>
  );
};

export default AnalyticsViewToggle;

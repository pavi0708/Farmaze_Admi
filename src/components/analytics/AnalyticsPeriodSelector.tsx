
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsFilters } from "../products/ProductTypes";

interface AnalyticsPeriodSelectorProps {
  filters: AnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilters>>;
}

const AnalyticsPeriodSelector: React.FC<AnalyticsPeriodSelectorProps> = ({ 
  filters, 
  setFilters 
}) => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const years = ["2023", "2024", "2025"];
  
  const handleTimeRangeChange = (value: 'daily' | 'weekly' | 'monthly') => {
    setFilters(prev => ({ ...prev, timeRange: value }));
  };
  
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex space-x-2">
        <Button 
          variant={filters.timeRange === "daily" ? "default" : "outline"}
          onClick={() => handleTimeRangeChange("daily")}
          className={filters.timeRange === "daily" ? "bg-[#F16870] hover:bg-[#F16870]/90" : ""}
          size="sm"
        >
          Daily
        </Button>
        <Button 
          variant={filters.timeRange === "weekly" ? "default" : "outline"}
          onClick={() => handleTimeRangeChange("weekly")}
          className={filters.timeRange === "weekly" ? "bg-[#F16870] hover:bg-[#F16870]/90" : ""}
          size="sm"
        >
          Weekly
        </Button>
        <Button 
          variant={filters.timeRange === "monthly" ? "default" : "outline"}
          onClick={() => handleTimeRangeChange("monthly")}
          className={filters.timeRange === "monthly" ? "bg-[#F16870] hover:bg-[#F16870]/90" : ""}
          size="sm"
        >
          Monthly
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Select 
          value={filters.month} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.year} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AnalyticsPeriodSelector;


import React from "react";
import { Search, Sparkle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BellDot } from "lucide-react";
import InsightsSidebarToggle from "./InsightsSidebarToggle";

interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onShowSuggestions?: () => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onShowSuggestions 
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Search products by name..." 
          className="pl-10 bg-white border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {onShowSuggestions && (
        <Button 
          onClick={onShowSuggestions}
          className="bg-blue-600 hover:bg-blue-700 shadow transition-all gap-2 w-full sm:w-auto"
        >
          <Sparkle size={16} className="text-white" />
          <span>AI Order Forecast</span>
        </Button>
      )}
      <Button
      className="bg-white border border-gray-200 rounded-lg py-3 px-4 shadow-md z-30 hover:bg-farmaze-orange/10 transition-colors group w-full sm:w-auto">
         <div className="flex items-center space-x-2">
                <BellDot className="text-farmaze-orange group-hover:text-rose-500 transition-colors" size={20} />
                <div className="flex flex-col text-sm leading-tight font-medium">
                  <span style={{color:"#020817"}} >Market Insights</span>
                </div>
                {/* {insightsCount > 0 && (
                  <div className="bg-farmaze-orange text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {insightsCount}
                  </div>
                )} */}
              </div>
      </Button>
        {/* <InsightsSidebarToggle 
        onClick={onShowSuggestions}
        insightsCount={0} // Replace with actual insights count>
        /> */}
    </div>
  );
};

export default ProductSearch;

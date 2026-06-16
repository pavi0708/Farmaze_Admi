
import React from "react";
import { ChevronDown } from "lucide-react";

interface FilterBarProps {
  selectedFilters: string[];
  toggleFilter: (filter: string) => void;
  filterTypes: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  selectedFilters, 
  toggleFilter, 
  filterTypes,
}) => {
  return (
    <div className="mb-6">
      {/* Filter chips */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        <button 
          className={`flex items-center px-4 py-2 rounded-md ${
            selectedFilters.length === 0 ? 'bg-rose-50 text-rose-600 font-medium' : 'bg-gray-50 text-gray-700'
          }`}
          onClick={() => toggleFilter("all")}
        >
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <div className="grid grid-cols-2 grid-rows-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
            </div>
          </div>
          <span>All</span>
        </button>
        
        {filterTypes.map((filter) => {
          if (filter === "Type") {
            return (
              <button 
                key={filter}
                className="px-4 py-2 rounded-md bg-gray-50 text-gray-700 whitespace-nowrap flex items-center"
              >
                {filter} <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            );
          }
          
          return (
            <button 
              key={filter}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                selectedFilters.includes(filter) ? 'bg-rose-50 text-rose-600 font-medium' : 'bg-gray-50 text-gray-700'
              }`}
              onClick={() => toggleFilter(filter)}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;

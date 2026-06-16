
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-4 py-2">
        <Search className="text-rose-500 mr-2" size={20} />
        <Input
          type="text"
          placeholder="Search items or categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 h-auto"
        />
      </div>
    </div>
  );
};

export default SearchBar;

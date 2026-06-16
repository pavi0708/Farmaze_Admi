
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  shownItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  shownItems,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange
}) => {
  return (
    <div className="flex justify-between p-4 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">Showing {shownItems} of {totalItems} products</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </Button>
        
        {/* Generate page numbers dynamically */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // For 5 or fewer pages, show all pages
          let pageNum = i + 1;
          
          // For more than 5 pages, show a window around the current page
          if (totalPages > 5) {
            if (currentPage <= 3) {
              // Near the start: show pages 1-5
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Near the end: show the last 5 pages
              pageNum = totalPages - 4 + i;
            } else {
              // In the middle: show current page and 2 pages on each side
              pageNum = currentPage - 2 + i;
            }
          }
          
          return (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 ${pageNum === currentPage ? 'bg-farmaze-orange text-white hover:bg-farmaze-orange/90' : 'text-gray-600'}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

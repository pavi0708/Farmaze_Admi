
import React, { useState } from "react";
import { ShoppingCart, Calendar, Clock, Percent, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface DailyRecommendation {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  frequency: string;
  lastOrdered: string;
}

interface DailyRecommendationsProps {
  recommendations: DailyRecommendation[];
  day: string;
  isLoading: boolean;
  onAddToCart: (items: DailyRecommendation[]) => void;
}

const DailyRecommendations: React.FC<DailyRecommendationsProps> = ({
  recommendations,
  day,
  isLoading,
  onAddToCart
}) => {
  const [selectedItems, setSelectedItems] = useState<DailyRecommendation[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4; // 4 items per page

  const handleSelectItem = (recommendation: DailyRecommendation) => {
    setSelectedItems(prev => {
      const index = prev.findIndex(item => item.id === recommendation.id);
      if (index >= 0) {
        // Item already exists, remove it
        return prev.filter(item => item.id !== recommendation.id);
      } else {
        // Item doesn't exist, add it
        return [...prev, recommendation];
      }
    });
  };

  const handleAddToCart = () => {
    if (selectedItems.length > 0) {
      onAddToCart(selectedItems);
      setSelectedItems([]);
      toast.success(`${selectedItems.length} items added to cart`);
    }
  };

  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const displayedRecommendations = recommendations.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  // Calculate tomorrow's date in human-readable format
  const getTomorrowDisplay = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="mr-2 text-farmaze-orange" size={20} />
          <h2 className="text-xl font-semibold text-farmaze-brown">
            Recommendations for {getTomorrowDisplay()}
          </h2>
        </div>
        
        {selectedItems.length > 0 && (
          <Button
            onClick={handleAddToCart}
            variant="default"
            className="bg-farmaze-orange hover:bg-farmaze-orange/90 gap-2"
          >
            <ShoppingCart size={16} />
            Add Selected to Cart
          </Button>
        )}
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {displayedRecommendations.map((recommendation) => {
            const isSelected = selectedItems.some(item => item.id === recommendation.id);
            
            return (
              <Card 
                key={recommendation.id}
                className={`
                  transition-all duration-200 hover:shadow-md border-2
                  ${isSelected ? 'border-farmaze-orange/50 bg-farmaze-orange/5' : 'border-gray-200'}
                `}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-farmaze-brown">{recommendation.name}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={`
                        font-normal flex items-center gap-1
                        ${isSelected ? 'bg-farmaze-orange/10 text-farmaze-orange border-farmaze-orange/30' : 'bg-gray-50 text-gray-600 border-gray-200'}
                      `}
                    >
                      <Percent size={12} /> {recommendation.frequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp size={14} className="mr-1 text-farmaze-orange/80" />
                      <span>{recommendation.quantity} {recommendation.unit}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={14} className="mr-1 text-farmaze-orange/80" />
                      <span>{recommendation.lastOrdered}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p>You typically order this for tomorrow.</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`
                      w-full transition-all
                      ${isSelected ? 
                        'bg-farmaze-orange hover:bg-farmaze-orange/90 text-white' : 
                        'border-farmaze-orange/50 text-farmaze-orange hover:bg-farmaze-orange/10'}
                    `}
                    onClick={() => handleSelectItem(recommendation)}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <span className="flex items-center text-sm text-gray-600 px-2">
              {currentPage + 1} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecommendations;

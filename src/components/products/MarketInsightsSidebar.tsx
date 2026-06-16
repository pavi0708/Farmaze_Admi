
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain, TrendingDown, TrendingUp, Truck, AlertTriangle, Sun, ShoppingCart, X, BellDot } from "lucide-react";

interface MarketInsight {
  id: string;
  category: 'weather' | 'price' | 'logistics' | 'demand';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  affectedProducts: string[];
  priceImpact: string;
  date: string;
  icon: string;
}

interface MarketInsightsSidebarProps {
  insights: MarketInsight[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productName: string) => void;
}

const MarketInsightsSidebar: React.FC<MarketInsightsSidebarProps> = ({
  insights,
  isLoading,
  isOpen,
  onClose,
  onAddToCart
}) => {
  if (!isOpen) return null;

  // Function to get icon based on category
  const getIcon = (iconName: string, size: number = 20) => {
    switch (iconName) {
      case 'cloud-rain':
        return <CloudRain size={size} />;
      case 'trending-down':
        return <TrendingDown size={size} />;
      case 'trending-up':
        return <TrendingUp size={size} />;
      case 'truck':
        return <Truck size={size} />;
      case 'sun':
        return <Sun size={size} />;
      default:
        return <AlertTriangle size={size} />;
    }
  };

  // Function to get color based on impact
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Function to get color based on price impact
  const getPriceImpactColor = (priceImpact: string | undefined) => {
    if (!priceImpact) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    return priceImpact.startsWith('+') 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="fixed top-0 right-0 h-full bg-white shadow-lg z-40 w-64 md:w-72 overflow-y-auto border-l border-gray-200">
      <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <BellDot className="mr-2 text-farmaze-orange" size={16} />
          <h2 className="text-base font-semibold text-farmaze-brown">Market Insights</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-1 h-7 w-7">
          <X size={16} />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : !insights || insights.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="mx-auto mb-2" size={24} />
            <p>No market insights available</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div 
              key={insight.id}
              className="border rounded-lg p-3 bg-white hover:border-farmaze-orange/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <Badge 
                  variant="outline" 
                  className={`
                    font-normal flex items-center gap-1 text-xs
                    ${getImpactColor(insight.impact)}
                  `}
                >
                  {getIcon(insight.icon, 12)} {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`
                    font-normal flex items-center gap-1 text-xs
                    ${getPriceImpactColor(insight.priceImpact)}
                  `}
                >
                  {insight.priceImpact && insight.priceImpact.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
                  {insight.priceImpact || 'N/A'}
                </Badge>
              </div>
              
              <h3 className="font-medium text-farmaze-brown mb-1 text-sm">{insight.title}</h3>
              
              <p className="text-xs text-gray-600 mb-2">
                {insight.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {insight.affectedProducts && insight.affectedProducts.map((product, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                  >
                    {product}
                  </Badge>
                ))}
              </div>
              
              {onAddToCart && insight.affectedProducts && insight.affectedProducts.length > 0 && (
                <div className="flex justify-end mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-farmaze-orange/50 text-farmaze-orange hover:bg-farmaze-orange/10 h-7 px-2 py-0"
                    onClick={() => onAddToCart(insight.affectedProducts[0])}
                  >
                    <ShoppingCart size={12} className="mr-1" />
                    Add to Cart
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketInsightsSidebar;

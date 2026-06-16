
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudRain, TrendingDown, TrendingUp, Truck, AlertTriangle, Sun, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface MarketInsightsProps {
  insights: MarketInsight[];
  isLoading: boolean;
  onAddToCart?: (productName: string) => void;
}

const MarketInsights: React.FC<MarketInsightsProps> = ({
  insights,
  isLoading,
  onAddToCart
}) => {
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
  const getPriceImpactColor = (priceImpact: string) => {
    return priceImpact.startsWith('+') 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <AlertTriangle className="mr-2 text-farmaze-orange" size={20} />
        <h2 className="text-xl font-semibold text-farmaze-brown">
          Market Insights & Alerts
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Card 
            key={insight.id}
            className="border-2 border-gray-100 hover:shadow-md transition-all"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge 
                  variant="outline" 
                  className={`
                    mb-2 font-normal flex items-center gap-1
                    ${getImpactColor(insight.impact)}
                  `}
                >
                  {getIcon(insight.icon, 14)} {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`
                    font-normal flex items-center gap-1
                    ${getPriceImpactColor(insight.priceImpact)}
                  `}
                >
                  {insight.priceImpact.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
                  {insight.priceImpact}
                </Badge>
              </div>
              <CardTitle className="text-lg text-farmaze-brown">
                {insight.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {insight.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {insight.affectedProducts.map((product, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="bg-gray-50 text-gray-700 border-gray-200"
                  >
                    {product}
                  </Badge>
                ))}
              </div>
              
              {onAddToCart && insight.affectedProducts.length > 0 && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-farmaze-orange/50 text-farmaze-orange hover:bg-farmaze-orange/10"
                    onClick={() => onAddToCart(insight.affectedProducts[0])}
                  >
                    <ShoppingCart size={12} className="mr-1" />
                    Add to Cart
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarketInsights;

/**
 * ForecastWidget — Tomorrow's top 5 predicted products.
 */
import { useState, useEffect } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import analyticsApi from "@/api/analyticsApi";

interface ForecastWidgetProps {
  onAddToCart?: (items: any[]) => void;
}

export default function ForecastWidget({ onAddToCart }: ForecastWidgetProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getDemandForecast(1);
        const top5 = (data?.products || [])
          .sort((a: any, b: any) => (b.forecast?.[0]?.predicted_qty || 0) - (a.forecast?.[0]?.predicted_qty || 0))
          .slice(0, 5);
        setPredictions(top5);
        
        // Try to get context
        try {
          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const ctxData = await analyticsApi.getProductSuggestionsWithContext(dayNames[tomorrow.getDay()]);
          setContext(ctxData?.context || null);
        } catch {}
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

  const getConfidenceStyle = (label?: string) => {
    switch (label) {
      case 'high': return 'bg-primary/10 text-primary';
      case 'medium': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="card-modern"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-rubik text-sm font-semibold text-foreground">Tomorrow's Forecast</h4>
        <span className="text-xs text-muted-foreground">{tomorrowStr}</span>
      </div>

      {context?.festival && (
        <div className="text-xs text-secondary bg-secondary/5 border border-secondary/10 rounded-lg px-3 py-1.5 mb-3">
          {context.festival} — expect adjustments in order quantities
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading forecast...</span>
        </div>
      ) : predictions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No forecast data available</p>
      ) : (
        <>
          <div className="space-y-2">
            {predictions.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-foreground truncate max-w-[55%]">{p.product_name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-foreground">
                    {Math.round(p.forecast?.[0]?.predicted_qty || 0)} {p.unit || 'units'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getConfidenceStyle(p.confidence_label)}`}>
                    {p.confidence_label || 'low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {onAddToCart && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 text-xs"
              onClick={() => onAddToCart(predictions)}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              Add all to cart
            </Button>
          )}
        </>
      )}
    </motion.div>
  );
}

import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export interface WasteAlertItem {
  id: string;
  productName: string;
  orderedQty: number;
  suggestedQty: number;
  unit: string;
  averageQty: number;
  deviationPercent: number;
  wasteCost: number;
}

interface WasteAlertOverlayProps {
  alerts: WasteAlertItem[];
  onKeepQuantity: (alertId: string) => void;
  onUseSuggested: (alertId: string, suggestedQty: number) => void;
  onDismiss: (alertId: string) => void;
}

const WasteAlertOverlay: React.FC<WasteAlertOverlayProps> = ({
  alerts,
  onKeepQuantity,
  onUseSuggested,
  onDismiss,
}) => {
  const [expanded, setExpanded] = useState(false);

  const totalExcessCost = useMemo(
    () => alerts.reduce((sum, a) => sum + a.wasteCost, 0),
    [alerts]
  );

  if (alerts.length === 0) return null;

  const handleApplyAll = () => {
    alerts.forEach((alert) => onUseSuggested(alert.id, alert.suggestedQty));
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden shadow-sm">
      {/* Summary bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-amber-900 font-rubik">
              {alerts.length} {alerts.length === 1 ? 'item' : 'items'} flagged for over-ordering
            </span>
            {totalExcessCost > 0 && (
              <span className="text-xs text-amber-700 font-rubik ml-2">
                · ~₹{totalExcessCost.toLocaleString('en-IN')} potential waste
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && (
            <span className="text-xs text-amber-600 font-rubik hidden sm:inline">
              Review
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-600" />
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {/* Column headers (desktop) */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center text-[11px] uppercase tracking-wider text-amber-600/70 font-rubik font-medium px-2 pb-1.5 border-b border-amber-200/60">
                <span>Product</span>
                <span className="text-right w-28">Ordering vs Avg</span>
                <span className="text-right w-20">Deviation</span>
                <span className="text-right w-52">Actions</span>
              </div>

              {/* Alert rows */}
              <div className="divide-y divide-amber-100">
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="py-2 px-2"
                    >
                      {/* Desktop row */}
                      <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                        <span className="text-sm font-medium text-amber-900 font-rubik truncate">
                          {alert.productName}
                        </span>
                        <span className="text-xs text-amber-700 font-rubik text-right w-28">
                          <span className="font-semibold">{alert.orderedQty}</span>
                          <span className="text-amber-500 mx-1">→</span>
                          <span>{alert.averageQty} {alert.unit}</span>
                        </span>
                        <span className="text-xs font-semibold text-red-600 font-rubik text-right w-20">
                          +{alert.deviationPercent}%
                        </span>
                        <div className="flex items-center gap-1.5 justify-end w-52">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUseSuggested(alert.id, alert.suggestedQty)}
                            className="h-7 text-[11px] font-rubik bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 px-2.5"
                          >
                            Use {alert.suggestedQty}{alert.unit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onKeepQuantity(alert.id)}
                            className="h-7 text-[11px] font-rubik border-amber-300 text-amber-700 hover:bg-amber-100 px-2.5"
                          >
                            Keep
                          </Button>
                          <button
                            onClick={() => onDismiss(alert.id)}
                            className="p-1 rounded hover:bg-amber-200/60 transition-colors"
                            aria-label="Dismiss"
                          >
                            <X className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile row */}
                      <div className="sm:hidden space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-amber-900 font-rubik">
                            {alert.productName}
                          </span>
                          <button
                            onClick={() => onDismiss(alert.id)}
                            className="p-1 rounded hover:bg-amber-200/60"
                            aria-label="Dismiss"
                          >
                            <X className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-700 font-rubik">
                          <span>
                            <span className="font-semibold">{alert.orderedQty}</span> → {alert.averageQty} {alert.unit}
                          </span>
                          <span className="font-semibold text-red-600">+{alert.deviationPercent}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUseSuggested(alert.id, alert.suggestedQty)}
                            className="h-7 text-[11px] font-rubik bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 flex-1"
                          >
                            Use {alert.suggestedQty}{alert.unit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onKeepQuantity(alert.id)}
                            className="h-7 text-[11px] font-rubik border-amber-300 text-amber-700 hover:bg-amber-100 flex-1"
                          >
                            Keep {alert.orderedQty}{alert.unit}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Apply all suggestions */}
              {alerts.length > 1 && (
                <div className="pt-2 mt-1 border-t border-amber-200/60 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleApplyAll}
                    className="h-7 text-[11px] font-rubik bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    <Zap className="h-3 w-3" />
                    Apply all suggestions
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WasteAlertOverlay;

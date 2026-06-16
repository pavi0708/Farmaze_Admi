import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, Pencil, ShoppingCart, Sparkles, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Branch {
  id: string;
  name: string;
  location: string;
}

/** Parse "Product Name 5kg" → { name, qty } */
function parsePredictionLine(line: string): { name: string; qty: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Match trailing number+unit like "5kg", "2.5L", "10pcs"
  const match = trimmed.match(/^(.+?)\s+([\d.]+\s*\w+)$/);
  if (match) return { name: match[1].trim(), qty: match[2].trim() };
  return { name: trimmed, qty: '' };
}

interface BranchListProps {
  branches: Branch[];
  predictions: Record<string, string>;
  isLoading: boolean;
  selectedBranchId: string | null;
  tomorrowDay: string;
  onSelectBranch: (branchId: string) => void;
  onReorder: (branchId: string) => void;
}

const BranchList: React.FC<BranchListProps> = ({
  branches,
  predictions,
  isLoading,
  selectedBranchId,
  tomorrowDay,
  onSelectBranch,
  onReorder,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-0.5">
        {branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;
          const predictionText = predictions[branch.id] || '';
          const allItems = predictionText
            .split('\n')
            .map(parsePredictionLine)
            .filter(Boolean) as { name: string; qty: string }[];
          const visibleItems = allItems.slice(0, 4);
          const remaining = allItems.length - visibleItems.length;

          return (
            <Card
              key={branch.id}
              className={`overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:shadow-sm hover:border-primary/30'
              }`}
              onClick={() => onSelectBranch(branch.id)}
            >
              <div className="p-3 space-y-2">
                {/* Branch header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1 rounded-md ${
                        isSelected ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Store
                        className={`h-3.5 w-3.5 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm font-playfair truncate leading-tight">
                        {branch.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-rubik leading-tight">
                        {branch.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <Badge
                        variant="default"
                        className="text-[9px] bg-primary/10 text-primary border-0 px-1.5 py-0"
                      >
                        Active
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[9px] font-rubik gap-0.5 border-muted-foreground/20 px-1.5 py-0"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {tomorrowDay.slice(0, 3)}
                    </Badge>
                  </div>
                </div>

                {/* Product items */}
                {isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading predictions...
                  </div>
                ) : visibleItems.length > 0 ? (
                  <div className="space-y-0.5">
                    {visibleItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Package className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-xs font-rubik text-foreground/80 truncate">
                            {item.name}
                          </span>
                        </div>
                        {item.qty && (
                          <span className="text-[11px] font-rubik font-medium text-primary shrink-0 bg-primary/8 px-1.5 py-0.5 rounded">
                            {item.qty}
                          </span>
                        )}
                      </div>
                    ))}
                    {remaining > 0 && (
                      <p className="text-[10px] text-muted-foreground pl-2 pt-0.5">
                        +{remaining} more items
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-1 pl-1">
                    No predictions yet
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-[11px] font-rubik gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBranch(branch.id);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-[11px] font-rubik gap-1 bg-farmaze-green hover:bg-farmaze-green/90 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder(branch.id);
                    }}
                    disabled={isLoading || !predictionText.trim()}
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Re-order
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default BranchList;

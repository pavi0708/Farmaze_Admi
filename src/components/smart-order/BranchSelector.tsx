import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, ChevronRight, Package } from 'lucide-react';

export interface Branch {
  id: string;
  name: string;
  location: string;
}

interface PredictionSummary {
  itemCount: number;
}

interface BranchSelectorProps {
  branches: Branch[];
  predictions: Record<string, string>;
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
}

function countItems(predictionText: string): number {
  return predictionText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  predictions,
  selectedBranchId,
  onSelectBranch,
}) => {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-base font-semibold font-playfair">Branches</h2>
          <p className="text-sm text-muted-foreground font-rubik">
            Select the branch you're ordering for
          </p>
        </div>
        <Badge variant="outline" className="font-rubik text-xs">
          {branches.length} branches
        </Badge>
      </div>

      {/* Branch rows */}
      <div className="divide-y">
        {branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;
          const predText = predictions[branch.id] || '';
          const itemCount = countItems(predText);

          return (
            <div
              key={branch.id}
              className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => onSelectBranch(branch.id)}
            >
              {/* Icon */}
              <div className="p-2.5 bg-muted rounded-xl shrink-0">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm font-playfair">
                    {branch.name}
                  </h3>
                  {isSelected && (
                    <Badge className="text-[10px] bg-farmaze-green/10 text-farmaze-green border-0 px-1.5 py-0">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground font-rubik">
                    {branch.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-rubik cursor-pointer hover:underline">
                    <Clock className="h-3 w-3" />
                    Last order ›
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-rubik">
                  <Package className="h-3.5 w-3.5" />
                  {itemCount} items
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BranchSelector;

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchedProduct } from './types';

interface MatchedProductsTableProps {
  items: MatchedProduct[];
  onRemove: (id: string) => void;
  onSelectAlternative: (id: string, alternativeName: string) => void;
  onSearchReplace: (id: string, productName: string) => void;
  animated?: boolean;
}

const StatusIcon: React.FC<{ status: string; confidence: number }> = ({ status, confidence }) => {
  if (status === 'matched' && confidence >= 85) {
    return <CheckCircle className="h-4 w-4 text-farmaze-green" />;
  }
  if (status === 'partial' || (confidence >= 50 && confidence < 85)) {
    return <AlertTriangle className="h-4 w-4 text-farmaze-gold" />;
  }
  return <XCircle className="h-4 w-4 text-destructive" />;
};

const ConfidenceBadge: React.FC<{ confidence: number; animated?: boolean }> = ({ confidence, animated }) => {
  const color =
    confidence >= 85
      ? 'bg-green-50 text-farmaze-green border-green-200'
      : confidence >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-red-50 text-red-600 border-red-200';

  return (
    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold border ${color}`}>
      {confidence}%
    </Badge>
  );
};

const MatchedProductsTable: React.FC<MatchedProductsTableProps> = ({
  items,
  onRemove,
  onSelectAlternative,
  onSearchReplace,
  animated = true,
}) => {
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  return (
    <div className="card-modern overflow-hidden">
      <h3 className="text-lg font-medium font-playfair text-foreground mb-4 px-1">
        Matched Products
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground w-10" />
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">
                Your Text
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">
                Matched Product
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">
                Qty
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">
                Unit
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">
                Confidence
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={animated ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: animated ? index * 0.06 : 0, duration: 0.25 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  {/* Status icon */}
                  <TableCell className="py-3">
                    <StatusIcon status={item.status} confidence={item.confidence} />
                  </TableCell>

                  {/* Input text */}
                  <TableCell className="font-rubik text-sm text-muted-foreground py-3">
                    {item.inputText}
                  </TableCell>

                  {/* Matched product or alternative selector or search */}
                  <TableCell className="py-3">
                    {item.status === 'matched' && (
                      <span className="font-rubik text-sm font-medium text-foreground">
                        {item.matchedName}
                      </span>
                    )}
                    {item.status === 'partial' && item.alternatives && (
                      <Select
                        defaultValue={item.matchedName || undefined}
                        onValueChange={(val) => onSelectAlternative(item.id, val)}
                      >
                        <SelectTrigger className="h-8 text-sm font-rubik w-48">
                          <SelectValue placeholder="Choose product" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.alternatives.map((alt) => (
                            <SelectItem key={alt.sku} value={alt.name}>
                              {alt.name} ({alt.confidence}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {item.status === 'unmatched' && (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Search product..."
                          value={searchInputs[item.id] || ''}
                          onChange={(e) =>
                            setSearchInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="h-8 text-sm font-rubik w-40"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (searchInputs[item.id]) {
                              onSearchReplace(item.id, searchInputs[item.id]);
                            }
                          }}
                        >
                          <Search className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>

                  {/* Quantity */}
                  <TableCell className="font-rubik text-sm font-semibold text-foreground py-3">
                    {item.quantity}
                  </TableCell>

                  {/* Unit */}
                  <TableCell className="font-rubik text-sm text-muted-foreground py-3">
                    {item.unit}
                  </TableCell>

                  {/* Confidence */}
                  <TableCell className="py-3">
                    <ConfidenceBadge confidence={item.confidence} animated={animated} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MatchedProductsTable;

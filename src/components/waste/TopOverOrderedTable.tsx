import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';

export interface OverOrderedProduct {
  id: string;
  product: string;
  avgQty: number;
  unit: string;
  timesOverOrdered: number;
  totalWasteCost: number;
  lastOccurrence: string;
  severity: 'high' | 'medium' | 'low';
}

interface TopOverOrderedTableProps {
  products: OverOrderedProduct[];
}

type SortKey = 'timesOverOrdered' | 'totalWasteCost';

const severityRow: Record<string, string> = {
  high: 'bg-red-50/50',
  medium: 'bg-amber-50/40',
  low: '',
};

const TopOverOrderedTable: React.FC<TopOverOrderedTableProps> = ({ products }) => {
  const [sortKey, setSortKey] = useState<SortKey>('totalWasteCost');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...products].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="card-modern overflow-hidden">
      <h3 className="text-lg font-medium font-playfair text-foreground mb-4 px-1">
        Top Over-Ordered Products
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Avg Qty</TableHead>
              <TableHead
                className="font-rubik text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
                onClick={() => handleSort('timesOverOrdered')}
              >
                <span className="inline-flex items-center gap-1">
                  Times Over-ordered
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead
                className="font-rubik text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
                onClick={() => handleSort('totalWasteCost')}
              >
                <span className="inline-flex items-center gap-1">
                  Total Waste Cost
                  <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Last Occurrence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.id} className={`${severityRow[p.severity]} hover:bg-muted/50 transition-colors`}>
                <TableCell className="font-rubik text-sm font-medium text-foreground">{p.product}</TableCell>
                <TableCell className="font-rubik text-sm text-muted-foreground">
                  {p.avgQty} {p.unit}
                </TableCell>
                <TableCell className="font-rubik text-sm font-semibold text-foreground">{p.timesOverOrdered}</TableCell>
                <TableCell className="font-rubik text-sm font-semibold text-red-600">
                  ₹{(p.totalWasteCost || 0).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="font-rubik text-sm text-muted-foreground">{p.lastOccurrence}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopOverOrderedTable;

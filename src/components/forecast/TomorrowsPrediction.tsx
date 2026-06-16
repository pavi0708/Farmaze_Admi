import React from 'react';
import { ShoppingCart, Loader2, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCart } from '@/context/CartContext';
import { Product } from '@/components/products/ProductTypes';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface ForecastItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface TomorrowsPredictionProps {
  items: ForecastItem[];
  tomorrowDate: string;
  loading: boolean;
}

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const color = confidence >= 85
    ? 'bg-green-50 text-green-700 border-green-200'
    : confidence >= 70
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase border ${color}`}>
      {confidence}%
    </span>
  );
};

const TrendIndicator = ({ trend, percent }: { trend: 'up' | 'down' | 'stable'; percent: number }) => {
  if (trend === 'up') return (
    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
      <TrendingUp size={14} /> +{percent}%
    </span>
  );
  if (trend === 'down') return (
    <span className="inline-flex items-center gap-1 text-red-500 text-sm font-medium">
      <TrendingDown size={14} /> -{percent}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium">
      <Minus size={14} /> 0%
    </span>
  );
};

const TomorrowsPrediction: React.FC<TomorrowsPredictionProps> = ({ items, tomorrowDate, loading }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addingAll, setAddingAll] = React.useState(false);

  const estimatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAddSingle = (item: ForecastItem) => {
    const product: Product = {
      id: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      description: '',
      category: '',
      imageUrl: '',
      quantity: 0,
      availability: 'in_stock',
    };
    addToCart(product, item.quantity);
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    for (const item of items) {
      handleAddSingle(item);
    }
    setAddingAll(false);
    navigate('/cart');
  };

  const handleExportCSV = () => {
    const headers = ['Product', 'Quantity', 'Unit', 'Confidence %', 'Trend'];
    const rows = items.map(i => [i.name, i.quantity, i.unit, i.confidence, `${i.trend} ${i.trendPercent}%`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-${tomorrowDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground font-rubik">Generating predictions…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      {/* 3px gradient top accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#4A6FA5] to-[#4A6FA5]/30" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-playfair text-lg font-medium text-foreground">Tomorrow's Predicted Order</h2>
            <p className="text-sm text-muted-foreground font-rubik mt-1">{tomorrowDate}</p>
          </div>
          {items.length > 0 && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold uppercase">
              {items.length} items
            </Badge>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground font-rubik">
            No predictions available for tomorrow.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100">
                    <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                    <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Predicted Qty</TableHead>
                    <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Confidence</TableHead>
                    <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground">Trend</TableHead>
                    <TableHead className="font-rubik text-xs uppercase tracking-wider text-muted-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <span className="font-rubik font-medium text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">/ {item.unit}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-rubik text-lg font-semibold text-foreground">{item.quantity}</span>
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={item.confidence} />
                      </TableCell>
                      <TableCell>
                        <TrendIndicator trend={item.trend} percent={item.trendPercent} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md px-4 py-2 font-medium text-sm"
                          onClick={() => handleAddSingle(item)}
                        >
                          <ShoppingCart size={14} className="mr-1.5" />
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-rubik font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                    <span className="font-rubik text-xl font-semibold text-foreground">{item.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <ConfidenceBadge confidence={item.confidence} />
                      <TrendIndicator trend={item.trend} percent={item.trendPercent} />
                    </div>
                    <Button size="sm" variant="outline" className="rounded-md" onClick={() => handleAddSingle(item)}>
                      <ShoppingCart size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-rubik mb-1">Estimated Total</p>
                <p className="font-rubik text-2xl font-semibold text-foreground">
                  ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-md px-6 py-2.5 font-medium"
                  onClick={handleExportCSV}
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
                <Button
                  className="rounded-md px-6 py-2.5 font-medium bg-primary hover:bg-primary/90"
                  onClick={handleAddAll}
                  disabled={addingAll}
                >
                  {addingAll ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</>
                  ) : (
                    <><ShoppingCart className="mr-2 h-4 w-4" />Order All Predicted Items</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TomorrowsPrediction;

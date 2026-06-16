// ProductMatchPreview - Interactive table showing AI-matched products
// Lets user select from options, edit quantities, and add all to cart

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  RotateCcw,
  Package,
} from 'lucide-react';
import type { InstantMatchResult, MatchedItem } from '@/types/instantOrder';

interface ProductMatchPreviewProps {
  matchResult: InstantMatchResult;
  onAddToCart: (
    items: Array<{
      product_id: string;
      product_name: string;
      sku: string;
      unit: string;
      price: number;
      quantity: number;
    }>
  ) => void;
  onCancel: () => void;
}

// Confidence badge component
function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        {score}%
      </Badge>
    );
  }
  if (score >= 50) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {score}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
      <XCircle className="h-3 w-3 mr-1" />
      {score}%
    </Badge>
  );
}

const ProductMatchPreview: React.FC<ProductMatchPreviewProps> = ({
  matchResult,
  onAddToCart,
  onCancel,
}) => {
  const { matched_items, unmatched_items, analysis } = matchResult;

  // Track user selections and quantity edits
  const [selections, setSelections] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    matched_items.forEach((item) => {
      initial[item.index] = item.selected_option_id || 1;
    });
    return initial;
  });

  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    matched_items.forEach((item) => {
      initial[item.index] = item.quantity;
    });
    return initial;
  });

  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set());

  // Get selected option for an item
  const getSelectedOption = (item: MatchedItem) => {
    const selectedId = selections[item.index] || 1;
    return item.options.find((o) => o.option_id === selectedId) || item.options[0];
  };

  // Calculate estimated total
  const estimatedTotal = useMemo(() => {
    let total = 0;
    matched_items.forEach((item) => {
      if (removedItems.has(item.index)) return;
      const option = getSelectedOption(item);
      if (option) {
        total += option.unit_price * (quantities[item.index] || item.quantity);
      }
    });
    return total;
  }, [matched_items, selections, quantities, removedItems]);

  // Active items count (not removed)
  const activeItemCount = matched_items.filter(
    (item) => !removedItems.has(item.index)
  ).length;

  // Handle "Add All to Cart"
  const handleAddAllToCart = () => {
    const cartItems = matched_items
      .filter((item) => !removedItems.has(item.index))
      .map((item) => {
        const option = getSelectedOption(item);
        return {
          product_id: option.product_id,
          product_name: option.product_name,
          sku: option.sku,
          unit: option.unit_name,
          price: option.unit_price,
          quantity: quantities[item.index] || item.quantity,
        };
      });

    onAddToCart(cartItems);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-green-600" />
          Matched Products
        </CardTitle>
        {/* Summary badges */}
        <div className="flex gap-2 mt-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {analysis.matched_count} matched
          </Badge>
          {analysis.unmatched_count > 0 && (
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-200"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {analysis.unmatched_count} unmatched
            </Badge>
          )}
          <Badge variant="outline" className="text-gray-600">
            {analysis.total_items} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Matched items table */}
        {matched_items.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Your Text</TableHead>
                  <TableHead>Matched Product</TableHead>
                  <TableHead className="text-right w-24">Unit Price</TableHead>
                  <TableHead className="text-center w-20">Qty</TableHead>
                  <TableHead className="text-right w-24">Total</TableHead>
                  <TableHead className="text-center w-24">Confidence</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matched_items.map((item) => {
                  if (removedItems.has(item.index)) return null;
                  const selectedOption = getSelectedOption(item);
                  const qty = quantities[item.index] || item.quantity;
                  const rowTotal = selectedOption
                    ? selectedOption.unit_price * qty
                    : 0;

                  return (
                    <TableRow key={item.index} className="hover:bg-gray-50">
                      {/* Row number */}
                      <TableCell className="text-gray-500 text-sm">
                        {item.index}
                      </TableCell>

                      {/* Original text */}
                      <TableCell className="font-medium text-sm">
                        {item.name}{' '}
                        <span className="text-gray-400">
                          {item.quantity}
                          {item.unit}
                        </span>
                      </TableCell>

                      {/* Matched product selector */}
                      <TableCell>
                        {item.options.length > 1 ? (
                          <Select
                            value={String(selections[item.index] || 1)}
                            onValueChange={(val) =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.index]: Number(val),
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options.map((opt) => (
                                <SelectItem
                                  key={opt.option_id}
                                  value={String(opt.option_id)}
                                >
                                  {opt.product_name}
                                  {opt.unit_name ? ` (${opt.unit_name})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm">
                            {selectedOption?.product_name}
                            {selectedOption?.unit_name
                              ? ` (${selectedOption.unit_name})`
                              : ''}
                          </span>
                        )}
                      </TableCell>

                      {/* Unit price */}
                      <TableCell className="text-right text-sm">
                        ₹{selectedOption?.unit_price?.toFixed(2) || '0.00'}
                      </TableCell>

                      {/* Editable quantity */}
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0.1}
                          step={0.5}
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.index]:
                                parseFloat(e.target.value) || item.quantity,
                            }))
                          }
                          className="h-8 w-16 text-center text-sm"
                        />
                      </TableCell>

                      {/* Row total */}
                      <TableCell className="text-right font-medium text-sm">
                        ₹{rowTotal.toFixed(2)}
                      </TableCell>

                      {/* Confidence */}
                      <TableCell className="text-center">
                        <ConfidenceBadge
                          score={selectedOption?.match_score || 0}
                        />
                      </TableCell>

                      {/* Remove */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                          onClick={() =>
                            setRemovedItems((prev) => {
                              const next = new Set(prev);
                              next.add(item.index);
                              return next;
                            })
                          }
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Unmatched items warning */}
        {unmatched_items.length > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-700">
              <strong>
                {unmatched_items.length} product
                {unmatched_items.length > 1 ? 's' : ''} could not be matched:
              </strong>
              <ul className="list-disc list-inside mt-1">
                {unmatched_items.map((item) => (
                  <li key={item.index}>
                    {item.name} ({item.quantity} {item.unit})
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-yellow-600">
                You can search for these manually in the Product Order List tab.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Footer: Total + Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <p className="text-sm text-gray-500">Estimated Total</p>
            <p className="text-xl font-semibold">₹{estimatedTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-400">
              {activeItemCount} item{activeItemCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={handleAddAllToCart}
              disabled={activeItemCount === 0}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add All to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductMatchPreview;

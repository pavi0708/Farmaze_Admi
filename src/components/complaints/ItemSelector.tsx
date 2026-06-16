import React, { useState } from 'react';
import { Check, ChevronsUpDown, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { OrderDetail } from '@/api/orderApi';

export interface SelectedItem {
  id: string;
  quantity: number;
}

interface ItemSelectorProps {
  orderItems: OrderDetail[];
  selectedItems: SelectedItem[];
  onChange: (selectedItems: SelectedItem[]) => void;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ orderItems, selectedItems, onChange }) => {
  const [open, setOpen] = useState(false);

  const selectedMap = new Map(selectedItems.map(si => [si.id, si.quantity]));

  const handleToggle = (itemId: string) => {
    if (selectedMap.has(itemId)) {
      onChange(selectedItems.filter(si => si.id !== itemId));
    } else {
      const orderItem = orderItems.find(oi => oi.id === itemId);
      onChange([...selectedItems, { id: itemId, quantity: 0 }]);
    }
  };

  const handleRemove = (itemId: string) => {
    onChange(selectedItems.filter(si => si.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const orderItem = orderItems.find(oi => oi.id === itemId);
    const maxQty = orderItem?.quantity ?? Infinity;
    const clamped = Math.max(0, Math.min(newQuantity, maxQty));
    onChange(selectedItems.map(si => si.id === itemId ? { ...si, quantity: clamped } : si));
  };

  const handleQuantityInputChange = (itemId: string, value: string) => {
    const parsed = parseFloat(value);
    if (value === '' || isNaN(parsed)) {
      onChange(selectedItems.map(si => si.id === itemId ? { ...si, quantity: 0 } : si));
      return;
    }
    handleQuantityChange(itemId, parsed);
  };

  const getStepSize = (orderItem: OrderDetail): number => {
    if (orderItem.quantity >= 10) return 1;
    if (orderItem.quantity >= 1) return 0.5;
    return 0.1;
  };

  if (orderItems.length === 0) return null;

  const selectedOrderItems = orderItems.filter(item => selectedMap.has(item.id));

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Which items are affected?</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] font-normal text-left"
          >
            {selectedItems.length === 0 ? (
              <span className="text-gray-500">Search and select items...</span>
            ) : (
              <span className="text-gray-700">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {orderItems.map((item) => {
                  const isSelected = selectedMap.has(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.product_name} ${item.id}`}
                      onSelect={() => handleToggle(item.id)}
                      className="cursor-pointer"
                    >
                      <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.product_name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items with editable quantity */}
      {selectedOrderItems.length > 0 && (
        <div className="space-y-2">
          {selectedOrderItems.map((item) => {
            const selectedQty = selectedMap.get(item.id) ?? item.quantity;
            const step = getStepSize(item);
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate block">
                    {item.product_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    Ordered: {item.quantity} {item.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, selectedQty - step)}
                    disabled={selectedQty <= 0}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <Input
                    type="number"
                    value={selectedQty}
                    onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                    onBlur={() => {
                      if (selectedQty < 0) {
                        handleQuantityChange(item.id, 0);
                      }
                    }}
                    className="h-7 w-16 text-center text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min={0}
                    max={item.quantity}
                    step={step}
                  />
                  <span className="text-xs text-gray-500 w-8">{item.unit}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, selectedQty + step)}
                    disabled={selectedQty >= item.quantity}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="ml-1 h-6 w-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ItemSelector;

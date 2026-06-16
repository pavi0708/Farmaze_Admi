import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useProductsAndCategories } from "@/hooks/useProductsAndCategories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { MyDateRangePicker } from "@/components/ui/MyDateRangePicker";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface DashboardFilters {
  timePeriod: string;
  category: string;
  categories?: string[];
  product: string;
  products?: string[];
  comparison: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export default function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (filters.startDate && filters.endDate) {
      return { from: new Date(filters.startDate), to: new Date(filters.endDate) };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return { from: start, to: end };
  });

  const [productSearch, setProductSearch] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    filters.products?.length ? filters.products : (filters.product && filters.product !== "all" ? [filters.product] : [])
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.categories?.length ? filters.categories : (filters.category && filters.category !== "all" ? [filters.category] : [])
  );

  const { categories, products, isLoading: isLoadingData, error } = useProductsAndCategories();

  const filteredProducts = useMemo(() => {
    if (filters.categories?.length) {
      return products.filter(p => p.value === "all" || (p.category && filters.categories!.includes(p.category)));
    }
    if (filters.category === "all") return products;
    return products.filter(product => product.category === filters.category || product.value === "all");
  }, [products, filters.category, filters.categories]);

  const visibleCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.label.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const list = filteredProducts.filter(p => p.value !== "all");
    if (!query) return list;
    return list.filter(p => p.label.toLowerCase().includes(query));
  }, [filteredProducts, productSearch]);

  const handleReset = () => {
    setSelectedProducts([]);
    setSelectedCategories([]);
    setProductSearch("");
    setCategorySearch("");
    onFiltersChange({ timePeriod: "30d", category: "all", categories: [], product: "all", products: [], comparison: "none", startDate: undefined, endDate: undefined });
  };

  const handleInlineDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range.to) {
      onFiltersChange({ ...filters, timePeriod: "custom", startDate: formatLocalDate(range.from), endDate: formatLocalDate(range.to) });
    }
  };

  // Category multi-select handlers
  const toggleCategory = (val: string) => setSelectedCategories(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  const applySelectedCategories = () => {
    if (selectedCategories.length === 1) {
      onFiltersChange({ ...filters, category: selectedCategories[0], categories: selectedCategories, product: "all", products: [] });
    } else {
      onFiltersChange({ ...filters, category: "all", categories: selectedCategories, product: "all", products: [] });
    }
    setCategoriesOpen(false);
  };

  // Product multi-select handlers
  const toggleProduct = (val: string) => setSelectedProducts(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  const applySelectedProducts = () => {
    if (selectedProducts.length === 1) {
      onFiltersChange({ ...filters, product: selectedProducts[0], products: selectedProducts });
    } else {
      onFiltersChange({ ...filters, product: "all", products: selectedProducts });
    }
    setProductsOpen(false);
  };

  const handleComparisonToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, comparison: checked ? "period" : "none" });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap py-2">
      {/* Date Range */}
      <div className="w-[260px]">
        <MyDateRangePicker dateRange={dateRange} onDateRangeChange={handleInlineDateRangeChange} />
      </div>

      {/* Category Multi-select */}
      <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-sm bg-card border-border hover:border-primary/50 min-w-[120px] justify-between" disabled={isLoadingData || error !== null}>
            <span className="truncate">
              {selectedCategories.length === 0 ? "All Categories" : selectedCategories.length === 1 ? selectedCategories[0] : `${selectedCategories.length} categories`}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <Input placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="mb-2 h-8 text-sm" />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {visibleCategories.filter(c => c.value !== "all").map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                <Checkbox checked={selectedCategories.includes(cat.value)} onCheckedChange={() => toggleCategory(cat.value)} />
                <span className="truncate">{cat.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-3 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])} className="text-xs h-7">Clear</Button>
            <Button size="sm" onClick={applySelectedCategories} className="text-xs h-7">Apply</Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Product Multi-select */}
      <Popover open={productsOpen} onOpenChange={setProductsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-sm bg-card border-border hover:border-primary/50 min-w-[120px] justify-between" disabled={isLoadingData || error !== null}>
            <span className="truncate">
              {selectedProducts.length === 0 ? "All Products" : selectedProducts.length === 1 ? (products.find(p => p.value === selectedProducts[0])?.label || selectedProducts[0]) : `${selectedProducts.length} products`}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="mb-2 h-8 text-sm" />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {visibleProducts.map((prod) => (
              <label key={prod.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                <Checkbox checked={selectedProducts.includes(prod.value)} onCheckedChange={() => toggleProduct(prod.value)} />
                <span className="truncate">{prod.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-3 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])} className="text-xs h-7">Clear</Button>
            <Button size="sm" onClick={applySelectedProducts} className="text-xs h-7">Apply</Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Compare Toggle */}
      <div className="flex items-center gap-2">
        <Switch checked={filters.comparison !== "none"} onCheckedChange={handleComparisonToggle} className="data-[state=checked]:bg-primary" />
        <span className="text-xs text-muted-foreground">Compare</span>
      </div>

      {isLoadingData && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground h-8 px-2">
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset
      </Button>
    </div>
  );
}

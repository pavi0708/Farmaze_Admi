import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Download, 
  X, 
  Filter, 
  CheckSquare, 
  Square,
  Loader2,
  Crown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { spendAnalyticsApi, TopProductData } from "@/api/spendAnalyticsApi";
import { volumeAnalyticsApi, TopVolumeProductData } from "@/api/volumeAnalyticsApi";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { useProductsAndCategories } from "@/hooks/useProductsAndCategories";

interface AllSKUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'spend' | 'volume';
  filters: any;
  granularity: 'total' | 'daily' | 'weekly' | 'monthly';
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  spend: number;
  volume: number;
  percentage: number;
  avgUnitPrice: number;
  orderFrequency: number;
  unit?: string;
}

const categoryColors = {
  "Vegetables": "bg-green-100 text-green-800",
  "Fruits": "bg-yellow-100 text-yellow-800", 
  "Leafy Greens": "bg-emerald-100 text-emerald-800",
  "Herbs": "bg-blue-100 text-blue-800",
  "Other": "bg-gray-100 text-gray-800"
};

export default function AllSKUsModal({ isOpen, onClose, type, filters, granularity }: AllSKUsModalProps) {
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'volume' | 'category'>('spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get categories and products for filtering
  const { categories, products, isLoading: categoriesLoading } = useProductsAndCategories();

  // Fetch all products data
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response: any[] = [];
        
        if (type === 'volume') {
          response = await volumeAnalyticsApi.getTopProductsByVolume({
            timePeriod: (filters.timePeriod || '30d') as '7d' | '30d' | '90d' | 'custom',
            granularity: granularity,
            limit: 1000, // Get all products
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          
          // Transform volume data
          const transformedData: ProductItem[] = response.map((item: TopVolumeProductData) => ({
            id: item.product_id,
            name: item.product_name,
            category: item.category_name,
            sku: `SKU-${item.product_id.slice(0, 8)}`,
            spend: 0, // Not available in volume data
            volume: item.total_volume_kg,
            percentage: item.percentage,
            avgUnitPrice: 0, // Not available in volume data
            orderFrequency: item.order_frequency,
            unit: 'kg'
          }));
          setAllProducts(transformedData);
        } else {
          response = await spendAnalyticsApi.getTopProducts({
            timePeriod: filters.timePeriod || '30d',
            granularity: granularity,
            limit: 1000, // Get all products
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          
          // Transform spend data
          const transformedData: ProductItem[] = response.map((item: TopProductData) => ({
            id: item.product_id,
            name: item.product_name,
            category: item.category,
            sku: item.product_sku || `SKU-${item.product_id.slice(0, 8)}`,
            spend: item.product_spend,
            volume: item.product_volume_kg,
            percentage: 0, // Calculate later
            avgUnitPrice: item.avg_unit_price,
            orderFrequency: item.order_frequency,
            unit: item.unit
          }));
          setAllProducts(transformedData);
        }
        
      } catch (err) {
        console.error('Error fetching all products:', err);
        setError('Failed to load products data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [isOpen, type, filters, granularity]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'spend':
          aValue = a.spend;
          bValue = b.spend;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = type === 'spend' ? a.spend : a.volume;
          bValue = type === 'spend' ? b.spend : b.volume;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedCategories, sortBy, sortOrder, type]);

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle product selection
  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Get selected products data
      const selectedData = filteredProducts.filter(product =>
        selectedProducts.includes(product.id)
      );

      if (selectedData.length === 0) {
        alert('Please select at least one product to export');
        return;
      }

      // Create CSV content
      const headers = [
        'Product Name',
        'Category',
        'SKU',
        type === 'spend' ? 
          (granularity === 'total' ? 'Total Spend' : `Avg ${granularity} Spend`) :
          (granularity === 'total' ? 'Total Volume (kg)' : `Avg ${granularity} Volume (kg)`),
        ...(type === 'spend' ? ['Avg Unit Price', 'Volume (kg)'] : ['Avg Volume per Order'])
      ];

      const csvContent = [
        headers.join(','),
        ...selectedData.map(product => [
          `"${product.name}"`,
          `"${product.category}"`,
          `"${product.sku}"`,
          type === 'spend' ? product.spend.toFixed(2) : product.volume.toFixed(2),
          ...(type === 'spend' ? 
            [product.avgUnitPrice.toFixed(2), product.volume.toFixed(2)] : 
            [(product.volume / Math.max(product.orderFrequency, 1)).toFixed(2)]
          )
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `all-skus-${type}-${granularity}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedProducts([]);
  };

  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map(p => p.category)));
    return cats.sort();
  }, [allProducts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>All SKUs by {type === 'spend' ? 'Spend' : 'Volume'} 
              {granularity !== 'total' && ` (${granularity} average)`}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-4 border-b pb-4">
          {/* Search and Filter Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, categories, or SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!searchTerm && selectedCategories.length === 0}
            >
              Clear
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categories:</label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort by:</label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value={type}>{type === 'spend' ? 'Spend' : 'Volume'}</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Order:</label>
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">High to Low</SelectItem>
                      <SelectItem value="asc">Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Selection and Export Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedProducts.length === filteredProducts.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-gray-600">
                {selectedProducts.length} of {filteredProducts.length} selected
              </span>
            </div>
            <Button
              onClick={handleExport}
              disabled={selectedProducts.length === 0 || isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Selected ({selectedProducts.length})
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading all products...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              <span>{error}</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">
                    {type === 'spend' ? 
                      (granularity === 'total' ? 'Total Spend' :
                       granularity === 'daily' ? 'Avg Daily Spend' :
                       granularity === 'weekly' ? 'Avg Weekly Spend' :
                       'Avg Monthly Spend') :
                     (granularity === 'total' ? 'Total Volume' :
                      granularity === 'daily' ? 'Avg Daily Volume' :
                      granularity === 'weekly' ? 'Avg Weekly Volume' :
                      'Avg Monthly Volume')}
                  </TableHead>
                  {type === 'spend' && (
                    <TableHead className="text-right">Avg Unit Price</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={categoryColors[product.category as keyof typeof categoryColors] || categoryColors.Other}
                        variant="secondary"
                      >
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {type === 'spend' ? 
                        formatCurrency(product.spend) : 
                        formatWeight(product.volume)}
                    </TableCell>
                    {type === 'spend' && (
                      <TableCell className="text-right">
                        {formatCurrency(product.avgUnitPrice)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} products
            {selectedCategories.length > 0 && (
              <span> in {selectedCategories.length} categories</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Camera, ShoppingCart, Store } from 'lucide-react';
import TextImportTab from './TextImportTab';
import OCRUploadTab from './OCRUploadTab';
import OrderListTable from '@/components/products/OrderListTable';
import ProductRequestModal from '@/components/products/ProductRequestModal';
import type { Branch } from './BranchSelector';
import { Product } from '@/components/products/ProductTypes';
import { ClientRecommendation } from '@/api/recommendationsApi';

interface OrderBuilderProps {
  branch: Branch | null;
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  recommendations: ClientRecommendation[];
  showRecommendations: boolean;
  onToggleRecommendations: () => void;
  allProducts: Product[];
  isLoadingAllProducts: boolean;
  onProductAdded: () => void;
}

const OrderBuilder: React.FC<OrderBuilderProps> = ({
  branch,
  products,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  recommendations,
  showRecommendations,
  onToggleRecommendations,
  allProducts,
  isLoadingAllProducts,
  onProductAdded,
}) => {
  const [activeTab, setActiveTab] = useState('text-import');
  const [showProductRequest, setShowProductRequest] = useState(false);

  if (!branch) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-16 space-y-3">
          <div className="p-3 bg-muted rounded-full w-fit mx-auto">
            <Store className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-rubik text-sm">
            Select a branch to start ordering
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground font-rubik">
          Adding items for <span className="font-semibold text-foreground">{branch.name}</span>
        </p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* 3-tab builder */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text-import" className="text-xs font-rubik gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Text Import
            </TabsTrigger>
            <TabsTrigger value="ocr-upload" className="text-xs font-rubik gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              OCR Upload
            </TabsTrigger>
            <TabsTrigger value="browse" className="text-xs font-rubik gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Browse
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4">
          {activeTab === 'text-import' && <TextImportTab />}
          {activeTab === 'ocr-upload' && <OCRUploadTab />}
          {activeTab === 'browse' && (
            <OrderListTable
              products={products}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              onRequestNewProduct={() => setShowProductRequest(true)}
              onScanOrder={() => {}}
              onScanOrderClick={() => {}}
              recommendations={recommendations}
              showRecommendations={showRecommendations}
              onToggleRecommendations={onToggleRecommendations}
              useRecommendationsAsDefault={true}
              allProducts={allProducts}
              isLoadingAllProducts={isLoadingAllProducts}
              onProductAdded={onProductAdded}
            />
          )}
        </div>
      </div>

      <ProductRequestModal
        isOpen={showProductRequest}
        onClose={() => setShowProductRequest(false)}
        onProductAdded={onProductAdded}
        products={allProducts}
        isLoadingProducts={isLoadingAllProducts}
      />
    </Card>
  );
};

export default OrderBuilder;

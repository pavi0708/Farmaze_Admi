import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderDetail } from '@/api/orderApi';
import { Product } from '@/components/products/ProductTypes';
import { Minus, Plus, Trash2, AlertTriangle, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderDetail[];
  orderId: string;
  orderStatus: string;
  onOrderUpdated: () => void;
}

interface EditableOrderItem extends OrderDetail {
  newQuantity: number;
  isRemoved: boolean;
  isNewItem?: boolean;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  orderItems,
  orderId,
  orderStatus,
  onOrderUpdated
}) => {
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  // Initialize editable items when modal opens
  useEffect(() => {
    if (isOpen && orderItems.length > 0) {
      const items = orderItems.map(item => ({
        ...item,
        newQuantity: item.quantity,
        isRemoved: false,
        isNewItem: false
      }));
      setEditableItems(items);
    }
  }, [isOpen, orderItems]);

  // Load available products for adding new items
  useEffect(() => {
    if (isOpen) {
      loadAvailableProducts();
    }
  }, [isOpen]);

  const loadAvailableProducts = async () => {
    try {
      // Import recommendationsApi dynamically
      const { recommendationsApi } = await import('@/api/recommendationsApi');
      const response = await recommendationsApi.getMyRecommendations(
        new Date().getFullYear(),
        1000, // Get all recommendations
        0
      );
      
      // Convert recommendations to Product format
      const recommendedProducts = (response.products || []).map((rec: any) => ({
        id: rec.product_id || rec.id, // Use product_id first, fallback to id
        name: rec.product_name || rec.name || '',
        sku: rec.product_sku || rec.sku || rec.product_id || rec.id, // Use product_sku or product_id as SKU
        unit: rec.unit_name || '',
        category: rec.category_name || rec.category || '',
        subcategory: rec.subcategory || '',
        price: 0, // Price not available in recommendations API
        quantity: 0,
        availability: '24 hrs delivery',
        description: `Recommended product`,
        imageUrl: rec.image_url || ''
      }));
      
      setAvailableProducts(recommendedProducts);
    } catch (error) {
      console.error('Failed to load recommended products:', error);
      setAvailableProducts([]);
    }
  };

  // Check if order can be edited
  const canEditOrder = () => {
    const statusLower = orderStatus.toLowerCase().replace(/_/g, ' ');
    const editableStatuses = ['order placed', 'pending', 'confirmed', 'in progress'];
    return editableStatuses.includes(statusLower);
  };

  const updateQuantity = (index: number, change: number) => {
    setEditableItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(0, item.newQuantity + change);
        return { ...item, newQuantity, isRemoved: newQuantity === 0 };
      }
      return item;
    }));
  };

  const setQuantity = (index: number, quantity: string) => {
    const numQuantity = Math.max(0, parseInt(quantity) || 0);
    setEditableItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, newQuantity: numQuantity, isRemoved: numQuantity === 0 };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setEditableItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, isRemoved: true, newQuantity: 0 };
      }
      return item;
    }));
  };

  const restoreItem = (index: number) => {
    setEditableItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, isRemoved: false, newQuantity: item.quantity };
      }
      return item;
    }));
  };

  const addNewItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product to add');
      return;
    }

    // Check if product already exists in order
    const existingItem = editableItems.find(item => 
      item.product_name === selectedProduct.name && !item.isRemoved
    );

    if (existingItem) {
      toast.error('This product is already in the order');
      return;
    }

    const newItem: EditableOrderItem = {
      id: `new-${Date.now()}`, // Temporary ID for new items
      product_id: selectedProduct.id, // Add product_id field
      product_name: selectedProduct.name,
      quantity: newItemQuantity,
      newQuantity: newItemQuantity,
      unit_price: selectedProduct.price || 0,
      unit: selectedProduct.unit,
      sku: selectedProduct.sku || selectedProduct.id, // Use actual SKU if available
      remarks: '',
      order_id: orderId,
      created_at: new Date().toISOString(),
      isRemoved: false,
      isNewItem: true
    };

    setEditableItems(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setNewItemQuantity(1);
    setShowAddProduct(false);
    toast.success('Product added to order');
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !editableItems.some(item => item.product_name === product.name && !item.isRemoved)
  );

  const hasChanges = () => {
    return editableItems.some(item => 
      item.newQuantity !== item.quantity || item.isRemoved || item.isNewItem
    );
  };

  const getValidItems = () => {
    return editableItems.filter(item => !item.isRemoved && item.newQuantity > 0);
  };

  const handleUpdateOrder = async () => {
    if (!hasChanges()) {
      toast.info('No changes to save');
      return;
    }

    const validItems = getValidItems();
    if (validItems.length === 0) {
      toast.error('Cannot update order with no items. Consider cancelling instead.');
      return;
    }

    setIsUpdating(true);
    try {
      const orderItems = validItems.map(item => ({
        product_id: item.product_id, // Use product_id field for both new and existing items
        quantity: item.newQuantity
      }));

      // Import orderApi dynamically to avoid circular imports
      const { default: orderApi } = await import('@/api/orderApi');
      
      await orderApi.editOrder(orderId, orderItems);
      toast.success('Order updated successfully');
      onOrderUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };


  const calculateTotal = () => {
    return editableItems
      .filter(item => !item.isRemoved)
      .reduce((total, item) => total + (item.unit_price || 0) * item.newQuantity, 0);
  };

  const calculateOriginalTotal = () => {
    return orderItems.reduce((total, item) => total + (item.unit_price || 0) * item.quantity, 0);
  };

  if (!canEditOrder()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Cannot Be Modified</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This order is in '{orderStatus}' status and cannot be edited.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Order Items</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Add Product Section */}
            {showAddProduct && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h4 className="font-medium mb-3 text-green-800">Add New Product</h4>
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    {searchTerm && (
                      <div className="max-h-40 overflow-y-auto border rounded-md">
                        {filteredProducts.slice(0, 5).map((product) => (
                          <div
                            key={product.id}
                            className="p-2 hover:bg-green-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedProduct(product);
                              setSearchTerm('');
                            }}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              {product.price ? `₹${product.price}` : 'Price varies'} per {product.unit}
                            </div>
                          </div>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="p-2 text-gray-500">No products found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedProduct && (
                    <div className="border rounded-md p-3 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium">{selectedProduct.name}</div>
                          <div className="text-sm text-gray-600">
                            {selectedProduct.price ? `₹${selectedProduct.price}` : 'Price varies'} per {selectedProduct.unit}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProduct(null)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={newItemQuantity}
                          onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600">{selectedProduct.unit}</span>
                        <Button onClick={addNewItem} size="sm" className="ml-auto">
                          Add to Order
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

                {editableItems.map((item, index) => {
                  const isEdited = item.newQuantity !== item.quantity || item.isRemoved || item.isNewItem;
                  return (
                    <div 
                      key={item.isNewItem ? `new-${index}` : index} 
                      className={`border rounded-lg p-4 transition-all ${
                        item.isRemoved 
                          ? 'opacity-50 bg-gray-50 border-red-200' 
                          : item.isNewItem
                            ? 'bg-green-50 border-green-200 shadow-sm'
                            : isEdited 
                              ? 'bg-blue-50 border-blue-200 shadow-sm' 
                              : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name}</h4>
                          {isEdited && !item.isRemoved && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.isNewItem ? `NEW: ${item.newQuantity} ${item.unit}` : `${item.quantity} → ${item.newQuantity} ${item.unit}`}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {item.isRemoved ? (
                          <Badge variant="destructive">Removed</Badge>
                        ) : item.isNewItem ? (
                          <Badge variant="default" className="bg-green-600">New Item</Badge>
                        ) : isEdited ? (
                          <Badge variant="default" className="bg-blue-600">Modified</Badge>
                        ) : null}
                      </div>
                    
                    {!item.isRemoved ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(index, -1)}
                            disabled={item.newQuantity <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.newQuantity}
                            onChange={(e) => setQuantity(index, e.target.value)}
                            className="w-20 text-center"
                            min="0"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(index, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-600">{item.unit}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreItem(index)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Restore Item
                      </Button>
                     )}
                   </div>
                 );
                })}

                {/* Changes Summary */}
                {hasChanges() && (
                  <div className="mt-4">
                    <Separator />
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Order Changes Summary:</h4>
                      <div className="space-y-1 text-sm">
                        {editableItems.map((item, index) => {
                          if (item.isRemoved) {
                            return (
                              <div key={index} className="flex justify-between text-red-600">
                                <span>• {item.product_name}</span>
                                <span>REMOVED</span>
                              </div>
                            );
                          } else if (item.isNewItem) {
                            return (
                              <div key={index} className="flex justify-between text-green-600">
                                <span>• {item.product_name}</span>
                                <span>NEW: {item.newQuantity} {item.unit}</span>
                              </div>
                            );
                          } else if (item.newQuantity !== item.quantity) {
                            return (
                              <div key={index} className="flex justify-between text-blue-600">
                                <span>• {item.product_name}</span>
                                <span>{item.quantity} → {item.newQuantity} {item.unit}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                )}
                </div>

            <DialogFooter className="flex-col space-y-2">
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrder}
                disabled={!hasChanges() || isUpdating || getValidItems().length === 0}
                className="w-full"
              >
                {isUpdating ? 'Updating...' : 'Update Order'}
              </Button>
            </DialogFooter>
          </div>
      </DialogContent>
    </Dialog>
  );
};
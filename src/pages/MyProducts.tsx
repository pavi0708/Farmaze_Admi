import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Search, Plus, Trash2, ChevronLeft, ChevronRight, Building2, Truck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FadeInSection from "@/components/ui/FadeInSection";
import { getMySuppliers, SupplierMapping } from "@/api/procurementApi";
import { recommendationsApi, productRequestsApi, ClientRecommendationsResponse } from "@/api/recommendationsApi";
import { productApi } from "@/api/productApi";
import { Product, ProductCategory } from "@/components/products/ProductTypes";
import BranchManagement from "./BranchManagement";

const BROWSE_PAGE_SIZE = 20;

// ─── Products Tab ────────────────────────────────────────────────────────────

interface ProductsTabProps {
  toast: ReturnType<typeof useToast>["toast"];
}

const ProductsTab: React.FC<ProductsTabProps> = ({ toast }) => {
  // My products (from recommendations — products client has ordered)
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myLoading, setMyLoading] = useState(true);

  // Browse products (full catalog)
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMyProducts();
    fetchBrowseProducts();
    fetchCategories();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setMyLoading(true);
      const data = await recommendationsApi.getMyRecommendations(
        new Date().getFullYear(),
        200
      );
      setMyProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch my products:", error);
      toast({
        title: "Error",
        description: "Failed to load your products",
        variant: "destructive",
      });
    } finally {
      setMyLoading(false);
    }
  };

  const fetchBrowseProducts = async () => {
    try {
      setBrowseLoading(true);
      const products = await productApi.getProductsWithCategoryHierarchy();
      setBrowseProducts(products);
    } catch (error) {
      console.error("Failed to browse products:", error);
    } finally {
      setBrowseLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await productApi.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleAddProduct = async (productId: string) => {
    setAddingIds((prev) => new Set(prev).add(productId));
    try {
      await productRequestsApi.addProductToRecommendations({ product_id: productId });
      await fetchMyProducts();
      toast({ title: "Success", description: "Product added to your list" });
    } catch (error) {
      console.error("Failed to add product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const myProductIds = useMemo(
    () => new Set(myProducts.map((p: any) => p.id || p.product_id)),
    [myProducts]
  );

  const filteredBrowse = useMemo(() => {
    return browseProducts.filter((p) => {
      if (myProductIds.has(p.id)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !p.name.toLowerCase().includes(term) &&
          !(p.category || "").toLowerCase().includes(term)
        )
          return false;
      }
      if (selectedCategory !== "all" && (p.category || "") !== selectedCategory)
        return false;
      return true;
    });
  }, [browseProducts, myProductIds, searchTerm, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredBrowse.length / BROWSE_PAGE_SIZE));
  const paginatedBrowse = filteredBrowse.slice(
    (currentPage - 1) * BROWSE_PAGE_SIZE,
    currentPage * BROWSE_PAGE_SIZE
  );

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) return categories.map((c) => c.name).sort();
    const unique = new Set(browseProducts.map((p) => p.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [categories, browseProducts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Panel — My Products */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            My Products ({myProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : myProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No products yet. Add from the catalog.</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y max-h-[600px] overflow-y-auto">
              {myProducts.map((product: any) => {
                const name = product.name || product.product_name;
                const unit = product.unit_name || product.unit || "Piece";
                const category = product.category || product.category_name || "";
                return (
                  <div key={product.id || product.product_id} className="flex items-center justify-between py-2.5 px-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{name}</span>
                        <span className="text-xs text-gray-400">{unit}</span>
                      </div>
                      {category && (
                        <span className="text-xs text-gray-400">{category}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Panel — Browse All Products */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                All Products
                {!browseLoading && (
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    ({filteredBrowse.length})
                  </span>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {browseLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filteredBrowse.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {searchTerm || selectedCategory !== "all"
                ? "No products match your filters."
                : "All products are already in your list."}
            </div>
          ) : (
            <>
              <div className="space-y-0 divide-y max-h-[500px] overflow-y-auto">
                {paginatedBrowse.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 rounded">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{product.name}</span>
                        <span className="text-xs text-gray-400">{product.unit}</span>
                      </div>
                      {product.category && (
                        <span className="text-xs text-gray-400">{product.category}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddProduct(product.id)}
                      disabled={addingIds.has(product.id)}
                      className="ml-2 flex-shrink-0 h-7 text-xs"
                    >
                      {addingIds.has(product.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Plus size={12} className="mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    {(currentPage - 1) * BROWSE_PAGE_SIZE + 1}–
                    {Math.min(currentPage * BROWSE_PAGE_SIZE, filteredBrowse.length)} of{" "}
                    {filteredBrowse.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <span className="text-xs text-gray-500 px-2">
                      {currentPage}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Suppliers Tab ───────────────────────────────────────────────────────────

interface SuppliersTabProps {
  toast: ReturnType<typeof useToast>["toast"];
}

const SuppliersTab: React.FC<SuppliersTabProps> = ({ toast }) => {
  const [suppliers, setSuppliers] = useState<SupplierMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getMySuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Truck className="h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-700 mb-1">No suppliers assigned</h3>
          <p className="text-sm text-gray-500">Contact your admin to assign suppliers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Assigned Suppliers ({suppliers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3 font-medium">Supplier</th>
                <th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Categories</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((supplier) => {
                // Handle snake_case API response
                const name = (supplier as any).supplier_name || supplier.SupplierName || "-";
                const phone = (supplier as any).supplier_phone;
                const phoneStr = typeof phone === "object" && phone?.Valid
                  ? phone.String
                  : typeof phone === "string"
                    ? phone
                    : supplier.SupplierPhone || null;
                const isDefault = (supplier as any).is_default ?? supplier.IsDefault;
                const cats = (supplier as any).categories || supplier.Categories || [];

                return (
                  <tr key={supplier.ID || (supplier as any).id} className="text-sm">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        {isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      {phoneStr || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {cats.length > 0 ? (
                          cats.map((cat: string) => (
                            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">All categories</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const MyProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const activeTab = searchParams.get("tab") || "products";

  const handleTabChange = (tab: string) => {
    setSearchParams(tab === "products" ? {} : { tab });
  };

  return (
    <div className="frame-container mx-auto px-4 py-6">
      <FadeInSection>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-farmaze-brown mb-1">My Business</h1>
          <p className="text-gray-500 text-sm">Manage your products, branches, and suppliers</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="products" className="gap-1.5">
              <Package size={14} />
              Products
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-1.5">
              <Building2 size={14} />
              Branches
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5">
              <Truck size={14} />
              Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTab toast={toast} />
          </TabsContent>

          <TabsContent value="branches">
            <BranchManagement />
          </TabsContent>

          <TabsContent value="suppliers">
            <SuppliersTab toast={toast} />
          </TabsContent>
        </Tabs>
      </FadeInSection>
    </div>
  );
};

export default MyProductsPage;

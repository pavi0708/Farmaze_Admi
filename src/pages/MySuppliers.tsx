import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, Phone, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FadeInSection from "@/components/ui/FadeInSection";
import { getMySuppliers, SupplierMapping } from "@/api/procurementApi";

const MySuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      <div className="frame-container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading suppliers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="frame-container mx-auto px-4 py-8">
      <FadeInSection>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farmaze-brown mb-2">My Suppliers</h1>
          <p className="text-gray-500">View your assigned suppliers and their details</p>
        </div>

        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Truck className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No suppliers assigned yet</h3>
              <p className="text-sm text-gray-500">Contact your admin to get suppliers assigned to your account.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Suppliers ({suppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Supplier</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Categories</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.ID} className="text-sm">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{supplier.SupplierName}</span>
                            {supplier.IsDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          {supplier.SupplierPhone ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone size={14} />
                              <span>{supplier.SupplierPhone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {supplier.Categories && supplier.Categories.length > 0 ? (
                              supplier.Categories.map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">All categories</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500" />
                            <span>{supplier.Priority}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={supplier.SupplierStatus === "active" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {supplier.SupplierStatus || "active"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </FadeInSection>
    </div>
  );
};

export default MySuppliers;

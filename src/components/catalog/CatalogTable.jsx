import React, { useState } from 'react';

const CatalogTable = ({ products, searchTerm, onSearchChange, categories, selectedCategory, onCategoryChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(60);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
      product.category?.toLowerCase() === selectedCategory ||
      product.subcategory?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Split products into two columns for display
  const midPoint = Math.ceil(paginatedProducts.length / 2);
  const leftColumnProducts = paginatedProducts.slice(0, midPoint);
  const rightColumnProducts = paginatedProducts.slice(midPoint);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded"></div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Catalog</h1>
        </div>
        <p className="text-gray-600">Browse our complete product selection</p>
      </div>

      {/* Controls */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id || "all"}
                  onClick={() => onCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 whitespace-nowrap">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200">
        {/* Left Column */}
        <div className="p-4">
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-[60px_60px_1fr_120px] gap-4 py-3 px-2 text-sm font-medium text-gray-600 border-b border-gray-200">
              <div>Item No</div>
              <div>SKU</div>
              <div>Product</div>
              <div className="text-center bg-green-100 px-2 py-1 rounded text-green-800">Qty (Unit)</div>
            </div>

            {/* Products */}
            {leftColumnProducts.map((product, index) => (
              <div key={product.id} className="grid grid-cols-[60px_60px_1fr_120px] gap-4 py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="text-sm text-gray-500 flex items-center">
                  {startIndex + index + 1}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  {product.sku}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {product.category || product.subcategory || 'General'}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full text-center text-sm text-gray-600">
                    {product.unit_name || product.unit || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="p-4">
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-[60px_60px_1fr_120px] gap-4 py-3 px-2 text-sm font-medium text-gray-600 border-b border-gray-200">
              <div>Item No</div>
              <div>SKU</div>
              <div>Product</div>
              <div className="text-center bg-green-100 px-2 py-1 rounded text-green-800">Qty (Unit)</div>
            </div>

            {/* Products */}
            {rightColumnProducts.map((product, index) => (
              <div key={product.id} className="grid grid-cols-[60px_60px_1fr_120px] gap-4 py-4 px-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="text-sm text-gray-500 flex items-center">
                  {startIndex + midPoint + index + 1}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  {product.sku || product.id}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {product.category || product.subcategory || 'General'}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full text-center text-sm text-gray-600">
                    {product.unit_name || product.unit || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <select 
            value={itemsPerPage} 
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={60}>60</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-500">items per page</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            ‹
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`h-8 w-8 flex items-center justify-center text-sm rounded ${
                  pageNum === currentPage ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogTable;
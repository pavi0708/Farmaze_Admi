import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const OrderScannerPage = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleScan = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Call the scan order API
      const response = await fetch('/api/scan-order', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Scan failed');
      }
      
      const result = await response.json();
      
      if (result.success && result.products && result.products.length > 0) {
        // Store scanned products in localStorage for the products page
        localStorage.setItem('scannedProducts', JSON.stringify(result.products));
        
        toast({
          title: `Scan complete — ${result.products.length} products extracted`,
          description: "Products have been added to your catalog view",
          variant: "default"
        });
        
        navigate('/smart-order');
      } else {
        toast({
          title: "No products found",
          description: "Please try with a clearer image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan failed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleScan(file);
    }
  };

  const handlePaste = async (event) => {
    event.preventDefault();
    const items = event.clipboardData?.items;
    
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          await handleScan(file);
        }
        break;
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/smart-order')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-md px-2 py-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Product Order List
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
              <div className="w-6 h-6 border-2 border-green-600 rounded-md flex items-center justify-center">
                <div className="w-2 h-2 border border-green-600 rounded-sm"></div>
                <div className="w-2 h-2 border border-green-600 rounded-sm"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Scanner</h1>
            <p className="text-gray-600 mb-2">Upload an image of your order form to extract products</p>
            <p className="text-sm text-gray-500">You can also paste an image directly using Ctrl+V (Cmd+V on Mac)</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Image Button */}
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </button>

            {/* Take Photo Button */}
            <button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Take Photo'}
              </span>
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload order image"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Take photo of order"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderScannerPage;
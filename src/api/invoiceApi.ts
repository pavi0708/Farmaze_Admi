import api from './authApi';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  total_amount: number;
  generated_at: string;
  status: string;
  branch_name?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  paid: number;
  pending: number;
}

export interface InvoiceDetailsResponse {
  invoice: Invoice;
  order: {
    id: string;
    order_number: string;
    status: string;
  };
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }>;
  client: {
    name: string;
    company_name: string;
    gst_id: string;
  };
}

/**
 * Get all invoices for the authenticated client
 * @param start_date Optional start date filter (YYYY-MM-DD)
 * @param end_date Optional end date filter (YYYY-MM-DD)
 * @returns List of invoices and summary amounts
 */
export const getInvoices = async (start_date?: string, end_date?: string): Promise<InvoiceListResponse> => {
  try {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    
    const url = `/b2bclients/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('Fetching invoices from:', url);
    
    const response = await api.get(url);
    console.log('Invoice API response:', response.data);
    
    if (!response.data || !response.data.invoices) {
      console.error('Invalid API response format:', response.data);
      return { invoices: [], total: 0, paid: 0, pending: 0 };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { invoices: [], total: 0, paid: 0, pending: 0 };
  }
};

/**
 * Get invoice details by invoice ID
 * @param invoiceId The invoice ID to get the details for
 * @returns Invoice details
 */
export const getInvoiceById = async (invoiceId: string): Promise<Invoice> => {
  try {
    const url = `/b2bclients/invoices/${invoiceId}`;
    console.log('Fetching invoice details from:', url);
    
    const response = await api.get(url);
    console.log('Invoice details response:', response.data);
    
    if (!response.data || !response.data.invoice) {
      console.error('Invalid API response format:', response.data);
      throw new Error('Invalid API response format');
    }
    
    return response.data.invoice;
  } catch (error) {
    console.error(`Error fetching invoice ${invoiceId}:`, error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Get invoice details by order ID
 * @param orderId The order ID to get the invoice for
 * @returns Invoice details with order and client information
 */
export const getInvoiceByOrderId = async (orderId: string): Promise<InvoiceDetailsResponse> => {
  try {
    const url = `/b2bclients/invoices/${orderId}/download_invoice`;
    console.log('Fetching invoice details from:', url);
    
    const response = await api.get(url);
    console.log('Invoice details response:', response.data);
    
    if (!response.data || !response.data.invoice) {
      console.error('Invalid API response format:', response.data);
      throw new Error('Invalid API response format');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching invoice for order ${orderId}:`, error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Download invoice PDF for an order
 * @param orderId The order ID to download the invoice for
 * @returns Blob containing the PDF file
 */
export const downloadInvoicePdf = async (orderId: string): Promise<Blob> => {
  try {
    const url = `/b2bclients/invoices/${orderId}/download_invoice`;
    console.log('Downloading invoice PDF from:', url);
    
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    console.log('Invoice PDF download successful, blob size:', response.data.size);
    return response.data;
  } catch (error) {
    console.error(`Error downloading invoice PDF for order ${orderId}:`, error);
    
    // Create a simple PDF blob with error message
    const errorText = 'Invoice PDF not available yet. Please try again later.';
    const blob = new Blob([errorText], { type: 'application/pdf' });
    return blob;
  }
};

/**
 * Helper function to open the invoice PDF in a new tab
 * @param orderId The order ID to view the invoice for
 * @param invoiceNumber Optional invoice number to use in the filename
 */
export const viewInvoicePdf = async (orderId: string, invoiceNumber?: string): Promise<void> => {
  try {
    console.log(`Attempting to view/download invoice PDF for order ${orderId}`);
    const blob = await downloadInvoicePdf(orderId);
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    console.log('Created blob URL for invoice PDF');
    
    // If we have an invoice number, download with that name
    if (invoiceNumber) {
      console.log(`Downloading invoice PDF with filename: ${invoiceNumber}.pdf`);
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('Invoice PDF download initiated');
    } else {
      // Just open in a new tab if no invoice number
      console.log('Opening invoice PDF in new tab');
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Error viewing invoice:', error);
    alert('Failed to view or download the invoice. Please try again later.');
  }
};

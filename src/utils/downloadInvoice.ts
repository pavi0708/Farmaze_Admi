import orderApi from '@/api/orderApi';

/**
 * Download an approved invoice PDF and trigger a browser save dialog.
 * Callers are responsible for only calling this when invoice_status === 'approved'.
 */
export async function downloadInvoiceFor(orderId: string, orderNumber: string): Promise<void> {
  const blob = await orderApi.downloadOrderInvoice(orderId);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Invoice_${orderNumber}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

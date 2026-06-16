import * as XLSX from 'xlsx';

// Types for different data exports
export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  data: any[];
  headers?: string[];
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Export data to Excel file with single sheet
 */
export const exportToExcel = (options: ExcelExportOptions): void => {
  try {
    const { filename, sheetName, data, headers, title, metadata } = options;
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheetData: any[][] = [];
    
    // Add title if provided
    if (title) {
      worksheetData.push([title]);
      worksheetData.push([]); // Empty row
    }
    
    // Add metadata if provided
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        worksheetData.push([key, value]);
      });
      worksheetData.push([]); // Empty row
    }
    
    // Add headers
    if (headers && headers.length > 0) {
      worksheetData.push(headers);
    } else if (data.length > 0) {
      // Auto-generate headers from first data object
      const autoHeaders = Object.keys(data[0]);
      worksheetData.push(autoHeaders);
    }
    
    // Add data rows
    data.forEach(row => {
      if (typeof row === 'object' && row !== null) {
        worksheetData.push(Object.values(row));
      } else {
        worksheetData.push([row]);
      }
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns
    const colWidths = worksheetData[0]?.map((_, colIndex) => {
      const maxLength = Math.max(
        ...worksheetData.map(row => 
          row[colIndex] ? String(row[colIndex]).length : 0
        )
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    }) || [];
    
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, finalFilename);
    
    console.log(`Excel file exported: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export Excel file');
  }
};

/**
 * Format currency values for Excel export (K, L, Cr format)
 */
export const formatCurrencyForExcel = (amount: number): string => {
  if (amount >= 10000000) { // 1 Crore = 10,000,000
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) { // 1 Lakh = 100,000
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) { // 1 Thousand = 1,000
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return `₹${amount.toFixed(2)}`;
};

/**
 * Format percentage values for Excel export
 */
export const formatPercentageForExcel = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

/**
 * Format weight values for Excel export
 */
export const formatWeightForExcel = (kg: number): string => {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)}K kg`;
  }
  return `${kg.toFixed(2)} kg`;
};

/**
 * Generate metadata for exports
 */
export const generateExportMetadata = (filters: any) => {
  const metadata: Record<string, any> = {
    'Export Date': new Date().toLocaleString(),
    'Time Period': filters.timePeriod || '30d',
  };
  
  if (filters.category && filters.category !== 'all') {
    metadata['Category Filter'] = filters.category;
  }
  
  if (filters.product && filters.product !== 'all') {
    metadata['Product Filter'] = filters.product;
  }
  
  if (filters.startDate && filters.endDate) {
    metadata['Custom Date Range'] = `${filters.startDate} to ${filters.endDate}`;
  }
  
  return metadata;
};

/**
 * Spend Trends specific export formatter
 */
export const exportSpendTrends = (data: any[], filters: any, granularity: string) => {
  let formattedData;
  
  if (granularity === 'daily') {
    // For daily - exclude Order Count and Avg Spend per Order
    formattedData = data.map(item => ({
      'Period': item.period,
      'Total Spend': formatCurrencyForExcel(item.spend || item.total_spend),
      'Total Volume': formatWeightForExcel(item.volume || item.total_volume_kg),
      'Unique Products': item.unique_products || 0
    }));
  } else {
    // For weekly/monthly - include all fields
    formattedData = data.map(item => ({
      'Period': item.period,
      'Total Spend': formatCurrencyForExcel(item.spend || item.total_spend),
      'Total Volume': formatWeightForExcel(item.volume || item.total_volume_kg),
      'Order Count': item.order_count || 0,
      'Unique Products': item.unique_products || 0,
      'Avg Spend per Order': formatCurrencyForExcel(item.avg_spend_per_order || 0)
    }));
  }
  
  exportToExcel({
    filename: `Spend_Trends_${granularity}`,
    sheetName: 'Spend Trends',
    data: formattedData,
    title: `Spend Trends Analysis - ${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`,
    metadata: generateExportMetadata(filters)
  });
};

/**
 * Category Analysis specific export formatter
 */
export const exportCategoryAnalysis = (data: any[], filters: any) => {
  const formattedData = data.map(item => ({
    'Category': item.name || item.category_name,
    'Total Spend': formatCurrencyForExcel(item.spend || item.category_spend),
    'Total Volume': formatWeightForExcel(item.volume || item.category_volume_kg),
    'Percentage of Total': formatPercentageForExcel(item.percentage),
    'Product Count': item.product_count || 0,
    'Order Count': item.order_count || 0,
    'Avg Cost per KG': (item.volume || item.category_volume_kg) > 0 ? formatCurrencyForExcel((item.spend || item.category_spend) / (item.volume || item.category_volume_kg)) : '₹0.00'
  }));
  
  exportToExcel({
    filename: 'Category_Spend_Analysis',
    sheetName: 'Category Analysis',
    data: formattedData,
    title: 'Category Spend Distribution Analysis',
    metadata: generateExportMetadata(filters)
  });
};

/**
 * Top Products specific export formatter
 */
export const exportTopProducts = (data: any[], filters: any, granularity: string) => {
  const formattedData = data.map((item, index) => {
    const productName = item.name || item.product_name;
    const category = item.category || '';
    const unit = item.unit || item.unit_name || '';
    
    // Combine product name with category and unit
    const fullProductName = `${productName}${category ? ` (${category})` : ''}${unit ? ` - ${unit}` : ''}`;
    
    return {
      'Rank': index + 1,
      'Product Name': fullProductName,
      'Total Spend': formatCurrencyForExcel(item.spend || item.product_spend),
      'Total Volume': formatWeightForExcel(item.volume || item.product_volume_kg),
      'Avg Unit Price': formatCurrencyForExcel(item.avgUnitPrice || item.avg_unit_price || 0),
      // 'Cost per KG': (item.volume || item.product_volume_kg) > 0 ? formatCurrencyForExcel((item.spend || item.product_spend) / (item.volume || item.product_volume_kg)) : '₹0.00'
    };
  });
  
  exportToExcel({
    filename: `Top_Products_${granularity}`,
    sheetName: 'Top Products',
    data: formattedData,
    title: `Top Products by Spend - ${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`,
    metadata: generateExportMetadata(filters)
  });
};

/**
 * Comparison Analysis specific export formatter
 */
export const exportComparisonAnalysis = (data: any[], filters: any, granularity: string) => {
  const formattedData = data.map(item => ({
    'Period': item.period,
    'Total Spend': formatCurrencyForExcel(item.spend),
    'Total Volume': formatWeightForExcel(item.volume),
    'Efficiency (Cost/KG)': formatCurrencyForExcel(item.efficiency),
    'Spend Growth': item.spendGrowth ? formatPercentageForExcel(item.spendGrowth) : 'N/A',
    'Volume Growth': item.volumeGrowth ? formatPercentageForExcel(item.volumeGrowth) : 'N/A'
  }));
  
  exportToExcel({
    filename: `Spend_vs_Volume_Comparison_${granularity}`,
    sheetName: 'Comparison Analysis',
    data: formattedData,
    title: `Spend vs Volume Comparison - ${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`,
    metadata: generateExportMetadata(filters)
  });
};

/**
 * Spend Insights specific export formatter
 */
export const exportSpendInsights = (insights: any[], filters: any) => {
  const formattedData = insights.map(insight => ({
    'Metric': insight.title,
    'Value': insight.value,
    'Change': insight.change,
    'Trend': insight.trend,
    'Description': insight.description
  }));
  
  exportToExcel({
    filename: 'Spend_Insights_Summary',
    sheetName: 'Spend Insights',
    data: formattedData,
    title: 'Spend Insights & Metrics Summary',
    metadata: generateExportMetadata(filters)
  });
};

/**
 * Weekday Products specific export formatter
 */
export const exportWeekdayProducts = (data: any[], filters: any, type: 'spend' | 'volume') => {
  const formattedData: any[] = [];
  
  data.forEach(dayData => {
    if (dayData.products && dayData.products.length > 0) {
      dayData.products.forEach((product: any, index: number) => {
        const productName = product.product_name || product.name;
        const category = product.category || '';
        const unit = product.unit || '';
        const fullProductName = `${productName}${category ? ` (${category})` : ''}${unit ? ` - ${unit}` : ''}`;
        
        formattedData.push({
          'Day': dayData.day_name,
          'Rank': index + 1,
          'Product Name': fullProductName,
          'Total Spend': formatCurrencyForExcel(product.product_spend || 0),
          'Total Volume': formatWeightForExcel(product.product_volume_kg || 0),
          'Avg Unit Price': formatCurrencyForExcel(product.avg_unit_price || 0),
          'Order Frequency': product.order_frequency || 0
        });
      });
    }
  });
  
  exportToExcel({
    filename: `Top_Products_by_Weekday_${type}`,
    sheetName: 'Weekday Products',
    data: formattedData,
    title: `Top Products by ${type.charAt(0).toUpperCase() + type.slice(1)} - By Weekday`,
    metadata: generateExportMetadata(filters)
  });
};

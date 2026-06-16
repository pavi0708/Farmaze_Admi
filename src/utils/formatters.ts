/**
 * Format currency in Indian format (K, L, Cr)
 * ₹29,854,408.25 → ₹2.99Cr
 */
export const formatCurrency = (amount: number): string => {
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
 * Format currency for detailed display (with commas)
 * Used for tooltips and detailed views
 */
export const formatCurrencyDetailed = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format percentage values
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

/**
 * Format weight values
 */
export const formatWeight = (kg: number): string => {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)}K kg`;
  }
  return `${kg.toFixed(2)} kg`;
};

/**
 * Format numbers in compact format
 */
export const formatNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
};

/**
 * Calculate average order value correctly
 * AOV = Total Spend / Number of Orders
 */
export const calculateAverageOrderValue = (totalSpend: number, orderCount: number): number => {
  return orderCount > 0 ? totalSpend / orderCount : 0;
};

/**
 * Calculate cost efficiency (cost per kg)
 */
export const calculateCostPerKg = (totalSpend: number, totalVolume: number): number => {
  return totalVolume > 0 ? totalSpend / totalVolume : 0;
};

/**
 * Calculate median of a number array.
 */
export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Smart order utilities for parsing and matching products
// Adapted from design-haven-farmaze smart order functionality

export interface ParsedProduct {
  name: string;
  quantity: number;
  unit: string;
}

export interface ProductMatch {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  total_price: number;
  similarity_score: number;
}

export interface MatchedItem {
  parsed: ParsedProduct;
  matches: ProductMatch[];
  // Support for API format
  name?: string;
  quantity?: number;
  unit?: string;
  index?: number;
  options_count?: number;
}

export interface SmartOrderResult {
  matched_items: MatchedItem[];
  unmatched_items: ParsedProduct[];
  total_items: number;
  total_matched: number;
  total_unmatched: number;
}

// Parse product list from natural language text
export function parseProductList(productText: string): ParsedProduct[] {
  const lines = productText.split('\n').filter(line => line.trim());
  const products: ParsedProduct[] = [];
  
  for (const line of lines) {
    // Match patterns like "Tomato 2box", "Onion 1bag", "Carrot 7kg", etc.
    const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*$/);
    if (match) {
      const [, name, quantity, unit] = match;
      products.push({
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit: unit || 'kg'
      });
    } else {
      // Try alternative patterns like "2box Tomato" or "1kg Onion"
      const altMatch = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
      if (altMatch) {
        const [, quantity, unit, name] = altMatch;
        products.push({
          name: name.trim(),
          quantity: parseFloat(quantity),
          unit: unit || 'kg'
        });
      }
    }
  }
  
  return products;
}

// Calculate similarity between two strings using Levenshtein distance
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Match parsed products against available products
export function matchProducts(
  parsedProducts: ParsedProduct[], 
  availableProducts: any[],
  minSimilarity: number = 0.6
): SmartOrderResult {
  const matchedItems: MatchedItem[] = [];
  const unmatchedItems: ParsedProduct[] = [];
  
  for (const parsedProduct of parsedProducts) {
    const matches = availableProducts
      .map((product: any) => {
        const nameScore = calculateSimilarity(
          parsedProduct.name.toLowerCase(), 
          product.name.toLowerCase()
        );
        return {
          ...product,
          similarity_score: nameScore,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku || product.id,
          unit_price: parseFloat(product.unit_price) || 0,
          total_price: (parseFloat(product.unit_price) || 0) * parsedProduct.quantity
        };
      })
      .filter((product: any) => product.similarity_score > minSimilarity)
      .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
      .slice(0, 3); // Top 3 matches
    
    if (matches.length > 0) {
      matchedItems.push({
        parsed: parsedProduct,
        matches: matches
      });
    } else {
      unmatchedItems.push(parsedProduct);
    }
  }
  
  return {
    matched_items: matchedItems,
    unmatched_items: unmatchedItems,
    total_items: parsedProducts.length,
    total_matched: matchedItems.length,
    total_unmatched: unmatchedItems.length
  };
}

// Format smart order result for display
export function formatSmartOrderResult(result: SmartOrderResult, clientName?: string): string {
  let output = clientName 
    ? `## Smart Order Analysis for ${clientName}\n\n`
    : `## Smart Order Analysis\n\n`;
  
  if (result.matched_items.length > 0) {
    output += `**✅ Matched Products (${result.matched_items.length}):**\n`;
    result.matched_items.forEach((item, index) => {
      // Handle both data structures - new API format and local format
      const itemName = item.name || item.parsed?.name || 'Unknown Product';
      const itemQuantity = item.quantity || item.parsed?.quantity || 0;
      const itemUnit = item.unit || item.parsed?.unit || '';
      
      output += `${index + 1}. **${itemName}** (${itemQuantity} ${itemUnit})\n`;
      
      // Handle matches if they exist (local format)
      if (item.matches) {
        item.matches.forEach((match, idx) => {
          output += `   Option ${idx + 1}: ${match.product_name} (${match.sku}) - ₹${match.unit_price} each = ₹${match.total_price.toFixed(2)}\n`;
        });
      }
      output += '\n';
    });
  }
  
  if (result.unmatched_items.length > 0) {
    output += `**❌ Unmatched Products (${result.unmatched_items.length}):**\n`;
    result.unmatched_items.forEach((item, index) => {
      output += `${index + 1}. ${item.name} - ${item.quantity} ${item.unit}\n`;
    });
    output += '\n';
  }
  
  output += `**📊 Summary:**\n`;
  output += `- Total items: ${result.total_items}\n`;
  output += `- Matched: ${result.total_matched}\n`;
  output += `- Unmatched: ${result.total_unmatched}\n`;
  
  return output;
}

// Convert smart order result to cart items
export function convertToCartItems(result: SmartOrderResult): any[] {
  const cartItems: any[] = [];
  
  result.matched_items.forEach((item) => {
    // Use the best match (first one) for each item
    if (item.matches.length > 0) {
      const bestMatch = item.matches[0];
      cartItems.push({
        id: bestMatch.product_id,
        name: bestMatch.product_name,
        quantity: item.parsed.quantity,
        unit: item.parsed.unit,
        price: bestMatch.unit_price,
        sku: bestMatch.sku
      });
    }
  });
  
  return cartItems;
}

/**
 * Utility functions for date handling
 */

/**
 * Calculate the previous period date range for comparison.
 * For rolling periods (7d/30d/90d): shifts back by the same number of days.
 * For custom: shifts back by (endDate - startDate) duration.
 * Returns ISO date strings (YYYY-MM-DD).
 */
export function calculatePreviousPeriod(
  timePeriod: string,
  startDate?: string,
  endDate?: string
): { start: string; end: string } | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  if (timePeriod === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Detect full-month selection → shift to previous calendar month
    const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const isFullMonth = start.getDate() === 1 &&
      (end.getDate() === lastDayOfMonth ||
       (end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth()));

    if (isFullMonth) {
      const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0); // last day of prev month
      return { start: toISO(prevStart), end: toISO(prevEnd) };
    }

    // Default: shift by duration
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 86400000); // day before current start
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    return { start: toISO(prevStart), end: toISO(prevEnd) };
  }

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[timePeriod];
  if (!days) return null;

  const currentEnd = new Date(now);
  const currentStart = new Date(now.getTime() - days * 86400000);
  const prevEnd = new Date(currentStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  return { start: toISO(prevStart), end: toISO(prevEnd) };
}

/**
 * Parse a date string in the format "DD/MM/YYYY HH:MM am/pm" or "DD/MM/YYYY"
 * @param dateString The date string to parse
 * @returns A JavaScript Date object or null if parsing fails
 */
export const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Check if the date string has time part
    const hasTimePart = dateString.split(' ').length > 1;
    
    if (hasTimePart) {
      // Format: "17/03/2025 10:51 pm"
      const parts = dateString.split(' ');
      const datePart = parts[0];
      const timePart = parts[1];
      const period = parts[2];
      
      if (!datePart || !timePart) return null;
      
      // Parse date part (DD/MM/YYYY)
      const [day, month, year] = datePart.split('/').map(Number);
      
      // Parse time part (HH:MM)
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Adjust hours for PM
      let adjustedHours = hours;
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        adjustedHours = hours + 12;
      } else if (period && period.toLowerCase() === 'am' && hours === 12) {
        adjustedHours = 0;
      }
      
      // Create date object (months are 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day, adjustedHours, minutes);
      
      // Validate the date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    } else {
      // Format: "26/03/2025" (date only)
      const [day, month, year] = dateString.split('/').map(Number);
      
      // Create date object with time set to midnight (months are 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day);
      
      // Validate the date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a time to a readable string
 * @param date The date to extract time from
 * @returns A formatted time string
 */
export const formatTime = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

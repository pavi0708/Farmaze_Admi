export interface FestivalDate {
  name: string;
  date: string;
  shortName: string;
}

/**
 * Indian festival dates for 2024-2027.
 * Lunar calendar festivals shift yearly.
 */
export const INDIAN_FESTIVALS: FestivalDate[] = [
  // 2024
  { name: "Pongal", date: "2024-01-15", shortName: "Pongal" },
  { name: "Holi", date: "2024-03-25", shortName: "Holi" },
  { name: "Eid ul-Fitr", date: "2024-04-11", shortName: "Eid" },
  { name: "Ganesh Chaturthi", date: "2024-09-07", shortName: "Ganesh" },
  { name: "Onam", date: "2024-09-15", shortName: "Onam" },
  { name: "Navratri", date: "2024-10-03", shortName: "Navratri" },
  { name: "Dussehra", date: "2024-10-12", shortName: "Dussehra" },
  { name: "Diwali", date: "2024-11-01", shortName: "Diwali" },
  { name: "Christmas", date: "2024-12-25", shortName: "Xmas" },
  // 2025
  { name: "Pongal", date: "2025-01-14", shortName: "Pongal" },
  { name: "Holi", date: "2025-03-14", shortName: "Holi" },
  { name: "Eid ul-Fitr", date: "2025-03-31", shortName: "Eid" },
  { name: "Ganesh Chaturthi", date: "2025-08-27", shortName: "Ganesh" },
  { name: "Onam", date: "2025-09-05", shortName: "Onam" },
  { name: "Navratri", date: "2025-09-22", shortName: "Navratri" },
  { name: "Dussehra", date: "2025-10-02", shortName: "Dussehra" },
  { name: "Diwali", date: "2025-10-20", shortName: "Diwali" },
  { name: "Christmas", date: "2025-12-25", shortName: "Xmas" },
  // 2026
  { name: "Pongal", date: "2026-01-14", shortName: "Pongal" },
  { name: "Holi", date: "2026-03-04", shortName: "Holi" },
  { name: "Eid ul-Fitr", date: "2026-03-20", shortName: "Eid" },
  { name: "Ganesh Chaturthi", date: "2026-08-17", shortName: "Ganesh" },
  { name: "Onam", date: "2026-08-25", shortName: "Onam" },
  { name: "Navratri", date: "2026-10-11", shortName: "Navratri" },
  { name: "Dussehra", date: "2026-10-20", shortName: "Dussehra" },
  { name: "Diwali", date: "2026-11-08", shortName: "Diwali" },
  { name: "Christmas", date: "2026-12-25", shortName: "Xmas" },
  // 2027
  { name: "Pongal", date: "2027-01-14", shortName: "Pongal" },
  { name: "Holi", date: "2027-03-22", shortName: "Holi" },
  { name: "Eid ul-Fitr", date: "2027-03-10", shortName: "Eid" },
  { name: "Ganesh Chaturthi", date: "2027-09-05", shortName: "Ganesh" },
  { name: "Onam", date: "2027-09-14", shortName: "Onam" },
  { name: "Dussehra", date: "2027-10-09", shortName: "Dussehra" },
  { name: "Diwali", date: "2027-10-29", shortName: "Diwali" },
  { name: "Christmas", date: "2027-12-25", shortName: "Xmas" },
];

/**
 * Get festivals that fall within a date range.
 */
export function getFestivalsInRange(startDate: string, endDate: string): FestivalDate[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return INDIAN_FESTIVALS.filter(f => {
    const d = new Date(f.date);
    return d >= start && d <= end;
  });
}

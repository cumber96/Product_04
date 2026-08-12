/**
 * True when `date` is the last calendar day of its local month. Computed by
 * checking whether local "tomorrow" rolls into the next month, so it never
 * touches UTC and needs no days-in-month lookup table (handles leap years
 * for free via the Date constructor).
 */
export function isLastDayOfMonth(date: Date = new Date()): boolean {
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

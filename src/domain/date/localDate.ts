/**
 * Formats a Date as a local-calendar YYYY-MM-DD string using the device's
 * local time (getFullYear/getMonth/getDate), never UTC. Two users in
 * different timezones — or the same user just after midnight local time —
 * must get their own local "today", not a UTC-shifted one.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

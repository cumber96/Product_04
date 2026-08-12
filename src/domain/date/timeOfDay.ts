export type TimeOfDay = 'morning' | 'afternoon';

/**
 * Local-time boundary between morning and afternoon: 00:00–11:59 local is
 * morning, 12:00–23:59 local is afternoon. Hardcoded per product policy —
 * revisit if Product 04 ever needs this configurable.
 */
const AFTERNOON_START_HOUR = 12;

/**
 * Classifies a moment into morning/afternoon using the device's local hour
 * (getHours), never UTC. Two users in different timezones — or the same
 * user around midnight — must get their own local classification.
 */
export function getLocalTimeOfDay(date: Date = new Date()): TimeOfDay {
  return date.getHours() < AFTERNOON_START_HOUR ? 'morning' : 'afternoon';
}

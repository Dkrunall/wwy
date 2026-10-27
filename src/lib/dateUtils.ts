import { CUTOFF_LEAD_DAYS, DEFAULT_CUTOFF_HOUR_IST, DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";

const DAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

// Parse "wed,sat" → [3, 6]
export function parseDeliveryDays(value: string): number[] {
  return value
    .split(",")
    .map((d) => DAY_MAP[d.trim().toLowerCase()])
    .filter((d) => d !== undefined) as number[];
}

function daysUntilNext(currentDay: number, deliveryDays: number[]): number {
  const sorted = [...deliveryDays].sort((a, b) => a - b);
  for (const d of sorted) {
    if (d > currentDay) return d - currentDay;
  }
  // Wrap to next week
  return 7 - currentDay + sorted[0];
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// The moment orders close for a delivery date (a UTC-midnight Date standing for an IST calendar day).
function cutoffInstant(deliveryDate: Date, cutoffHour: number): number {
  return deliveryDate.getTime() - CUTOFF_LEAD_DAYS * DAY_MS + cutoffHour * 60 * 60 * 1000 - IST_OFFSET_MS;
}

// The next delivery day still open for orders, and when it closes.
// Rule: orders close CUTOFF_LEAD_DAYS before the delivery day at `cutoffHour` IST
// (default 9 PM Monday for Wednesday, 9 PM Thursday for Saturday).
export function getNextWindow(
  deliveryDays = DEFAULT_DELIVERY_DAYS,
  cutoffHour = DEFAULT_CUTOFF_HOUR_IST,
  now = new Date()
): { date: Date; cutoffAt: Date } {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const today = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  for (let i = 0; i < 21; i++) {
    const date = new Date(today + i * DAY_MS);
    if (!deliveryDays.includes(date.getUTCDay())) continue;
    const cutoff = cutoffInstant(date, cutoffHour);
    if (now.getTime() < cutoff) return { date, cutoffAt: new Date(cutoff) };
  }
  throw new Error("No open delivery window found");
}

// Returns the earliest valid delivery date given delivery days and cutoff hour (IST).
export function calculateDeliveryDate(deliveryDays = DEFAULT_DELIVERY_DAYS, cutoffHour = DEFAULT_CUTOFF_HOUR_IST): Date {
  return getNextWindow(deliveryDays, cutoffHour).date;
}

// Returns the next `count` available delivery slots.
export function getAvailableDeliverySlots(count = 5, deliveryDays = DEFAULT_DELIVERY_DAYS, cutoffHour = DEFAULT_CUTOFF_HOUR_IST): Date[] {
  const earliest = calculateDeliveryDate(deliveryDays, cutoffHour);
  const slots: Date[] = [earliest];
  let current = earliest;
  while (slots.length < count) {
    const day = current.getUTCDay();
    const skip = daysUntilNext(day, deliveryDays);
    current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + skip));
    slots.push(current);
  }
  return slots;
}

export function isValidDeliveryDate(isoDate: string, deliveryDays = DEFAULT_DELIVERY_DAYS, cutoffHour = DEFAULT_CUTOFF_HOUR_IST): boolean {
  const d = new Date(isoDate + "T00:00:00Z");
  const day = d.getUTCDay();
  if (!deliveryDays.includes(day)) return false;
  const earliest = calculateDeliveryDate(deliveryDays, cutoffHour);
  return d >= earliest;
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function deliveryDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

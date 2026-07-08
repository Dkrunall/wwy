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

// Returns the earliest valid delivery date given delivery days and cutoff hour (IST).
export function calculateDeliveryDate(deliveryDays = [3, 6], cutoffHour = 12): Date {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);

  const hoursIST = ist.getUTCHours();
  const pastCutoff = hoursIST >= cutoffHour;

  const min = new Date(ist);
  min.setUTCDate(min.getUTCDate() + (pastCutoff ? 2 : 1));

  const day = min.getUTCDay();
  const sorted = [...deliveryDays].sort((a, b) => a - b);

  let daysUntil: number;
  const next = sorted.find((d) => d >= day);
  if (next !== undefined) {
    daysUntil = next - day;
  } else {
    // Wrap to next week
    daysUntil = 7 - day + sorted[0];
  }

  min.setUTCDate(min.getUTCDate() + daysUntil);
  return new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), min.getUTCDate()));
}

// Returns the next `count` available delivery slots.
export function getAvailableDeliverySlots(count = 5, deliveryDays = [3, 6], cutoffHour = 12): Date[] {
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

export function isValidDeliveryDate(isoDate: string, deliveryDays = [3, 6], cutoffHour = 12): boolean {
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

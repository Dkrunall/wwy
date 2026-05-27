// Returns the next Wednesday or Saturday on or after the minimum delivery date.
// 12 PM IST cutoff: before noon → earliest is tomorrow; at/after noon → day after tomorrow.
export function calculateDeliveryDate(): Date {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);

  const hoursIST = ist.getUTCHours();
  const pastCutoff = hoursIST >= 12;

  // Minimum date in IST
  const min = new Date(ist);
  min.setUTCDate(min.getUTCDate() + (pastCutoff ? 2 : 1));

  // Find next Wed (3) or Sat (6)
  const day = min.getUTCDay();
  const daysUntil = day <= 3 ? 3 - day : 6 - day;
  min.setUTCDate(min.getUTCDate() + daysUntil);

  return new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), min.getUTCDate()));
}

// Returns the next `count` available delivery slots (Wed/Sat) from the earliest possible date.
export function getAvailableDeliverySlots(count = 5): Date[] {
  const earliest = calculateDeliveryDate();
  const slots: Date[] = [earliest];
  let current = earliest;
  while (slots.length < count) {
    const day = current.getUTCDay();
    // Wed(3) → next Sat = +3 days; Sat(6) → next Wed = +4 days
    const skip = day === 3 ? 3 : 4;
    current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + skip));
    slots.push(current);
  }
  return slots;
}

export function isValidDeliveryDate(isoDate: string): boolean {
  const d = new Date(isoDate + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day !== 3 && day !== 6) return false;
  const earliest = calculateDeliveryDate();
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

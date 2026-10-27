// Single source of truth for delivery windows and order cutoffs (P2-1).
// The resolver in dateUtils.ts, the announcement bar, the Story page, the policy pages and
// checkout all read from here, so the rule can't drift between banner, Story and checkout.
// The OMS settings `delivery_days` and `cutoff_hour_ist` override these defaults at runtime;
// keep them in sync, or the written copy will disagree with checkout.

export const DEFAULT_DELIVERY_DAYS = [3, 6]; // Wednesday, Saturday (0 = Sunday)
export const DEFAULT_CUTOFF_HOUR_IST = 21; // 9 PM
export const CUTOFF_LEAD_DAYS = 2; // orders close two days before the delivery day

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour < 12 ? "AM" : "PM"}`;
}

export function deliveryDayName(day: number): string {
  return DAY_NAMES[day];
}

export function cutoffDayName(deliveryDay: number): string {
  return DAY_NAMES[(deliveryDay - CUTOFF_LEAD_DAYS + 7) % 7];
}

// One entry per delivery day, e.g. { delivery: "Wednesday", cutoff: "Monday", time: "9 PM" }.
export function scheduleWindows(days = DEFAULT_DELIVERY_DAYS, hour = DEFAULT_CUTOFF_HOUR_IST) {
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => ({ delivery: deliveryDayName(d), cutoff: cutoffDayName(d), time: formatHour(hour) }));
}

// "9 PM Monday for Wednesday, 9 PM Thursday for Saturday"
export function cutoffRuleText(days = DEFAULT_DELIVERY_DAYS, hour = DEFAULT_CUTOFF_HOUR_IST): string {
  return scheduleWindows(days, hour)
    .map((w) => `${w.time} ${w.cutoff} for ${w.delivery}`)
    .join(", ");
}

// "Wed & Sat"
export function deliveryDaysShort(days = DEFAULT_DELIVERY_DAYS): string {
  return [...days].sort((a, b) => a - b).map((d) => DAY_NAMES[d].slice(0, 3)).join(" & ");
}

// "Wednesday & Saturday"
export function deliveryDaysLong(days = DEFAULT_DELIVERY_DAYS): string {
  return [...days].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(" & ");
}

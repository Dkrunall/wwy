export function fmt(p: number) {
  return `₹${(p / 100).toFixed(0)}`;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const ALL_STATUSES = ["placed", "mixing", "stretching", "resting", "cold_proof", "baking", "out_for_delivery", "delivered"];

export function getStepIndex(s: string | null) {
  return ALL_STATUSES.indexOf(s || "placed");
}

export const D_LABELS: Record<string, string> = {
  placed: "Placed", mixing: "Mixing", stretching: "Stretch & Fold",
  resting: "Bulk Rest", cold_proof: "Cold Proof", baking: "Baking",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export const D_THEME: Record<string, { bg: string; text: string; border: string; pulse: string }> = {
  placed: { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200/60", pulse: "bg-zinc-400" },
  mixing: { bg: "bg-yellow-50/60", text: "text-yellow-800", border: "border-yellow-200/50", pulse: "bg-yellow-500" },
  stretching: { bg: "bg-yellow-50/60", text: "text-yellow-800", border: "border-yellow-200/50", pulse: "bg-yellow-500" },
  resting: { bg: "bg-amber-50/50", text: "text-amber-800", border: "border-amber-200/50", pulse: "bg-amber-500" },
  cold_proof: { bg: "bg-sky-50/40", text: "text-sky-700", border: "border-sky-200/50", pulse: "bg-sky-400" },
  baking: { bg: "bg-orange-50/50", text: "text-orange-800", border: "border-orange-200/50", pulse: "bg-orange-500" },
  out_for_delivery: { bg: "bg-sky-50/50", text: "text-sky-800", border: "border-sky-200/50", pulse: "bg-sky-500" },
  delivered: { bg: "bg-emerald-50/50", text: "text-emerald-800", border: "border-emerald-200/50", pulse: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-200/50", pulse: "bg-rose-400" },
};

export const PAY_THEME: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-200/60" },
  paid: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-200/60" },
  failed: { bg: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-200/60" },
};

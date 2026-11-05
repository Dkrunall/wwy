import { DIET_LABEL, type Diet } from "@/lib/diet";

// FSSAI food mark: green circle for vegetarian, brown triangle for non-vegetarian (egg).
export default function VegMark({ diet, className = "" }: { diet: Diet; className?: string }) {
  const colour = diet === "veg" ? "#008000" : "#7B3F00";
  return (
    <span
      role="img"
      aria-label={DIET_LABEL[diet]}
      title={DIET_LABEL[diet]}
      className={`inline-flex items-center justify-center w-6 h-6 bg-white rounded-md shadow-sm ${className}`}
    >
      <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke={colour} strokeWidth="1.5" />
        {diet === "veg" ? <circle cx="8" cy="8" r="4" fill={colour} /> : <path d="M8 3.5 12.5 12h-9z" fill={colour} />}
      </svg>
    </span>
  );
}

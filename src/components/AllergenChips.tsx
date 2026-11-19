// "Allergens" with each one as a chip, so they are easy to spot on every product card.
export default function AllergenChips({ allergens, className = "" }: { allergens?: string | null; className?: string }) {
  const list = (allergens ?? "")
    .replace(/^contains:?\s*/i, "")
    .split(/,(?![^(]*\))/)
    .map((a) => a.trim().replace(/\.$/, ""))
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div className={className}>
      <p className="text-[11px] font-black tracking-[0.15em] uppercase text-brand-brown/65 mb-1.5">Allergens</p>
      <ul className="flex flex-wrap gap-1.5">
        {list.map((a) => (
          <li key={a} className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-900 leading-none">
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}

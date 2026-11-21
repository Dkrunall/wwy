import Image from "next/image";
import VegMark from "@/components/VegMark";
import { dietOf } from "@/lib/diet";

const TINTS = ["bg-[#F5EDD7]", "bg-[#F3E3D3]", "bg-[#EFE6DA]", "bg-[#F6E7C9]", "bg-[#EDE3E6]", "bg-[#E8EBDD]"];

// A soft tint per product, stable across renders.
function tintFor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

// "garlic, dry coconut, cheese": the flavour ingredients, without flour, water, starter and salt.
export function flavourNotes(ingredients?: string | null, max = 4): string {
  if (!ingredients) return "";
  return ingredients
    .replace(/\([^()]*(\([^()]*\)[^()]*)*\)/g, "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !/flour|water|starter|^salt$|^sugar$/.test(s))
    .slice(0, max)
    .join(", ");
}

// Top of every product card: the product photo if there is one, otherwise a tinted panel with the
// name, flavour notes, veg mark and a tag.
export default function ProductHead({
  name,
  label,
  ingredients,
  allergens,
  className = "rounded-[1.25rem] mb-4",
  image,
}: {
  name: string;
  image?: string | null;
  label?: string;
  ingredients?: string | null;
  allergens?: string | null;
  className?: string;
}) {
  const diet = dietOf(ingredients, allergens);
  const notes = flavourNotes(ingredients);

  // A real product photo, when there is one: the name sits over the photo.
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-brand-oat min-h-[150px] sm:min-h-[190px] flex flex-col p-4 sm:p-5 ${className}`}>
        <Image src={image} alt={name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="relative flex items-start gap-2">
          {label && (
            <span className="max-w-[80%] text-[11px] leading-tight font-black tracking-[0.1em] uppercase bg-white/90 text-brand-brown px-2.5 py-1 rounded-full">{label}</span>
          )}
          {diet && <VegMark diet={diet} className="ml-auto" />}
        </div>
        <h3 className="relative mt-auto pt-16 font-serif font-normal text-white leading-[1.05] text-xl sm:text-[1.75rem]">{name}</h3>
        {notes && <p className="relative font-serif italic text-white/85 text-sm sm:text-base leading-snug mt-1.5 line-clamp-2">{notes}</p>}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${tintFor(name)} p-4 sm:p-5 min-h-[150px] sm:min-h-[190px] flex flex-col ${className}`}>
      <span aria-hidden="true" className="absolute -right-2 -bottom-10 font-serif italic leading-none text-brand-brown/[0.08] select-none pointer-events-none text-[9rem] sm:text-[12rem]">
        {name.charAt(0)}
      </span>
      <div className="relative flex items-start gap-2">
        {label && (
          <span className="max-w-[80%] text-[11px] leading-tight font-black tracking-[0.1em] uppercase bg-white/85 text-brand-brown px-2.5 py-1 rounded-full">{label}</span>
        )}
        {diet && <VegMark diet={diet} className="ml-auto" />}
      </div>
      <h3 className="relative mt-auto pt-6 font-serif font-normal text-brand-brown leading-[1.05] text-xl sm:text-[1.75rem]">{name}</h3>
      {notes && <p className="relative font-serif italic text-brand-brown/70 text-sm sm:text-base leading-snug mt-1.5 line-clamp-2">{notes}</p>}
    </div>
  );
}

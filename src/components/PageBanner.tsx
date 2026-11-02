import Image from "next/image";

// Top banner for content pages: brand-brown panel with a photo on the right.
export default function PageBanner({
  eyebrow,
  title,
  intro,
  image,
  alt = "",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image: string;
  alt?: string;
}) {
  return (
    <section className="w-full px-4 sm:px-8 xl:px-16 pt-28 sm:pt-36 pb-8 sm:pb-12">
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-brand-brown grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 p-7 sm:p-12 md:p-14 flex flex-col justify-center">
          <span className="text-brand-gold text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3 block">{eyebrow}</span>
          <h1 className="font-serif font-normal text-white tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.8rem)" }}>
            {title}
          </h1>
          {intro && <p className="text-sm sm:text-base font-bold text-brand-oat/75 leading-relaxed mt-4 max-w-xl">{intro}</p>}
        </div>
        <div className="relative h-48 sm:h-64 md:h-auto md:min-h-[320px]">
          <Image src={image} alt={alt} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

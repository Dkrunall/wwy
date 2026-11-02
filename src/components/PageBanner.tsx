import Image from "next/image";

// Full-width cinematic banner for content pages, same look as the Our Story hero.
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
    <section className="w-full relative overflow-hidden min-h-[60vh] sm:min-h-[65vh] flex items-end pb-12 sm:pb-20 px-4 sm:px-8 xl:px-16 pt-36 bg-brand-brown">
      <div className="absolute inset-0 z-0">
        <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover opacity-[0.3] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-brown via-brand-brown/80 to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-4xl">
        <span className="text-brand-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">{eyebrow}</span>
        <h1 className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05] mb-4" style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)" }}>
          {title}
        </h1>
        {intro && <p className="text-base sm:text-lg md:text-xl font-bold text-brand-oat/60 max-w-xl leading-relaxed">{intro}</p>}
      </div>
    </section>
  );
}

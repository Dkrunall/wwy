import Link from "next/link";

const eyebrow = "text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block";
const heading = "font-serif font-normal tracking-tight leading-[1.05] mb-6 sm:mb-8";
const body = "text-sm sm:text-base md:text-lg font-bold leading-relaxed max-w-xl";

// Homepage: "Flavour Lab" teaser.
export function FlavourLabSection() {
  return (
    <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-16 sm:py-28 border-t border-brand-brown/5">
      <div className="max-w-5xl mx-auto flex flex-col items-start">
        <span className={`${eyebrow} text-brand-terracotta`}>Welcome to the Flavour Lab</span>
        <h2 className={`${heading} text-brand-brown`} style={{ fontSize: "clamp(2.2rem, 6vw, 4.2rem)" }}>
          Curiosity is always <span className="text-brand-terracotta italic font-light">on the menu.</span>
        </h2>
        <p className={`${body} text-brand-brown/65 mb-4`}>
          Where familiar favourites meet new ideas. We&apos;re always exploring what sourdough can be, one flavour combination at a time.
        </p>
        <p className={`${body} text-brand-brown/45 mb-8`}>
          New discoveries, fresh batches and plenty of reasons to come back.
        </p>
        <Link
          href="/flavour-lab"
          className="inline-flex bg-brand-brown text-brand-oat hover:bg-brand-orange hover:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95"
        >
          Explore the Flavour Lab
        </Link>
      </div>
    </section>
  );
}

// Homepage: freshness and ordering.
export function FreshnessSection() {
  return (
    <section className="w-full bg-brand-brown px-4 sm:px-8 xl:px-16 py-16 sm:py-28 text-brand-oat">
      <div className="max-w-5xl mx-auto flex flex-col items-start">
        <span className={`${eyebrow} text-brand-gold`}>Good bread deserves a little patience</span>
        <h2 className={`${heading} text-white`} style={{ fontSize: "clamp(2.2rem, 6vw, 4.2rem)" }}>
          Baked fresh. <span className="text-brand-gold italic font-light">Delivered to your doorstep.</span>
        </h2>
        <p className={`${body} text-brand-oat/75 mb-4`}>
          Getting it home should be easy. We bake twice a week, bringing you fresh sourdough and flavour-led bakes made with care.
        </p>
        <p className={`${body} text-brand-oat/55 mb-8`}>
          Explore the available selection, place your order and plan your next delivery around our baking schedule.
        </p>
        <Link
          href="/story#how-it-works"
          className="inline-flex bg-brand-gold text-brand-brown hover:bg-brand-orange hover:text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95"
        >
          How it works
        </Link>
      </div>
    </section>
  );
}

// Homepage: closing call to action, above the footer.
export function FinalCtaSection() {
  return (
    <section className="w-full bg-brand-orange px-4 sm:px-8 xl:px-16 py-20 sm:py-28 text-center">
      <h2 className="font-serif font-normal text-white tracking-tight leading-[1.05] mb-4" style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)" }}>
        Your next favourite <span className="italic font-light">is out there.</span>
      </h2>
      <p className="text-white/85 font-bold text-sm sm:text-base max-w-md mx-auto mb-3 leading-relaxed">
        A little tang. A little crunch. A flavour you didn&apos;t see coming.
      </p>
      <p className="text-white/70 font-bold text-sm max-w-md mx-auto mb-10 leading-relaxed">
        We bake twice a week. Find your favourites and get the goodness delivered to your doorstep.
      </p>
      <Link
        href="/shop"
        className="inline-block bg-white text-brand-orange hover:bg-brand-brown hover:text-white px-10 sm:px-12 py-4 sm:py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-xl transition-all duration-300 active:scale-95"
      >
        Shop Wild Wild Yeast
      </Link>
    </section>
  );
}

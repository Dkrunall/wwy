import Link from "next/link";

const eyebrow = "text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block";

// Homepage: Flavour Lab and freshness, side by side in one strip.
export function FlavourFreshnessSection() {
  return (
    <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-10 sm:py-14 border-t border-brand-brown/5">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-8 flex flex-col items-start">
          <span className={`${eyebrow} text-brand-terracotta`}>Welcome to the Flavour Lab</span>
          <h2 className="font-serif font-normal tracking-tight leading-[1.05] mb-3 text-brand-brown" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)" }}>
            Curiosity is always <span className="text-brand-terracotta italic font-light">on the menu.</span>
          </h2>
          <p className="text-sm font-bold text-brand-brown/60 leading-relaxed mb-5">
            Where familiar favourites meet new ideas. We&apos;re always exploring what sourdough can be, one flavour combination at a time.
          </p>
          <Link
            href="/flavour-lab"
            className="mt-auto inline-flex bg-brand-brown text-brand-oat hover:bg-brand-orange hover:text-white px-7 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95"
          >
            Explore the Flavour Lab
          </Link>
        </div>
        <div className="bg-brand-brown rounded-[2rem] shadow-sm p-6 sm:p-8 flex flex-col items-start">
          <span className={`${eyebrow} text-brand-gold`}>Good bread deserves a little patience</span>
          <h2 className="font-serif font-normal tracking-tight leading-[1.05] mb-3 text-white" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)" }}>
            Baked fresh. <span className="text-brand-gold italic font-light">Delivered to your doorstep.</span>
          </h2>
          <p className="text-sm font-bold text-brand-oat/70 leading-relaxed mb-5">
            We bake twice a week. Place your order and plan your next delivery around our baking schedule.
          </p>
          <Link
            href="/story#how-it-works"
            className="mt-auto inline-flex bg-brand-gold text-brand-brown hover:bg-brand-orange hover:text-white px-7 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95"
          >
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}

// Homepage: closing call to action, above the footer.
export function FinalCtaSection() {
  return (
    <section className="w-full bg-brand-orange px-4 sm:px-8 xl:px-16 py-12 sm:py-16 text-center">
      <h2 className="font-serif font-normal text-white tracking-tight leading-[1.05] mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>
        Your next favourite <span className="italic font-light">is out there.</span>
      </h2>
      <p className="text-white/85 font-bold text-sm sm:text-base max-w-md mx-auto mb-3 leading-relaxed">
        A little tang. A little crunch. A flavour you didn&apos;t see coming.
      </p>
      <p className="text-white/70 font-bold text-sm max-w-md mx-auto mb-6 leading-relaxed">
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

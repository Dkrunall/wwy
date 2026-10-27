import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GiftingForm from "@/components/GiftingForm";
import { WHATSAPP_NUMBER } from "@/lib/contact";
import { GIFT_TIERS, GIFTING_LEAD_TIME, GIFTING_MIN_ORDER } from "@/lib/gifting";

export const metadata: Metadata = {
  title: "Gifting and Hampers",
  description: "Hampers of sourdough and bakes for gifts and corporate orders in Mumbai. Four tiers, packed to order.",
};

export default function GiftingPage() {
  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />

      <section className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-12 sm:pb-16 border-b border-brand-brown/5">
        <div className="max-w-6xl mx-auto">
          <span className="text-brand-orange text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3 block">Gifting</span>
          <h1 className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)" }}>
            Hampers.
          </h1>
          <p className="text-sm sm:text-base font-bold text-brand-brown/50 max-w-lg mt-4 leading-relaxed">
            Four tiers of bread and bakes, packed to order. For birthdays, festivals, thank-yous and corporate gifting.
          </p>
        </div>
      </section>

      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GIFT_TIERS.map((t) => (
            <div key={t.name} className="flex flex-col bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-7">
              <h2 className="font-serif font-normal text-2xl text-brand-brown tracking-tight">{t.name}</h2>
              <p className="text-xs font-bold text-brand-brown/40 mt-1 mb-4">{t.tagline}</p>
              <ul className="flex flex-col gap-1.5 text-sm font-bold text-brand-brown/70 flex-1">
                {t.contents.map((c) => (
                  <li key={c} className="flex gap-2"><span className="text-brand-orange">•</span>{c}</li>
                ))}
              </ul>
              <p className="font-black text-brand-orange text-lg mt-5 pt-4 border-t border-brand-brown/5">
                {t.priceRupees === null ? "Price on enquiry" : `₹${t.priceRupees}`}
              </p>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 text-xs font-black tracking-[0.12em] uppercase text-brand-brown/40 flex flex-col sm:flex-row gap-2 sm:gap-8">
          <span>{GIFTING_MIN_ORDER}</span>
          <span>{GIFTING_LEAD_TIME}</span>
        </div>
      </section>

      <section className="w-full bg-white px-4 sm:px-8 xl:px-16 py-14 sm:py-20 border-t border-brand-brown/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05] mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
            Send an enquiry.
          </h2>
          <p className="text-sm font-bold text-brand-brown/50 mb-8">Tell us what you have in mind. We reply on WhatsApp within one working day.</p>
          <GiftingForm whatsappNumber={WHATSAPP_NUMBER} />
        </div>
      </section>

      <Footer />
    </main>
  );
}

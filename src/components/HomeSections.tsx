import Link from "next/link";
import { CalendarDays, Clock, Truck } from "lucide-react";
import { cutoffRuleText, deliveryDaysLong } from "@/lib/schedule";
import { DELIVERY_CHARGE_TEXT } from "@/lib/shipping";

// Homepage: how ordering works, in three steps.
export function HowItWorksStrip() {
  const steps = [
    { icon: CalendarDays, title: "Pick a bake day", body: `We bake and deliver on ${deliveryDaysLong()}.` },
    { icon: Clock, title: "Order by the cutoff", body: `Orders close ${cutoffRuleText()}.` },
    { icon: Truck, title: "Delivered fresh", body: DELIVERY_CHARGE_TEXT },
  ];
  return (
    <section id="how-it-works" className="w-full bg-brand-brown px-4 sm:px-8 xl:px-16 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05] mb-6 sm:mb-8" style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}>
          Fresh bread, <span className="text-brand-gold italic font-light">three easy steps.</span>
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex sm:flex-col gap-4 sm:gap-3 bg-white/[0.06] border border-white/10 rounded-[1.25rem] sm:rounded-[1.75rem] p-4 sm:p-6">
              <span className="shrink-0 w-10 h-10 rounded-full bg-brand-gold text-brand-brown flex items-center justify-center" aria-hidden="true">
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] uppercase text-brand-gold">Step {i + 1}</p>
                <h3 className="font-serif text-lg sm:text-xl text-brand-oat leading-snug mt-0.5">{title}</h3>
                <p className="text-sm font-medium text-brand-oat/75 leading-relaxed mt-1">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Homepage: short links to the story pages, instead of full sections.
export function ExploreLinks() {
  const links = [
    { href: "/story", eyebrow: "Our story", title: "Not your everyday bread.", body: "Why we started, and what drives every bake." },
    { href: "/process", eyebrow: "Our process", title: "Good bread takes its time.", body: "From wild starter to oven, slowly." },
    { href: "/flavour-lab", eyebrow: "Flavour Lab", title: "Curiosity is always on the menu.", body: "Familiar favourites meet new ideas." },
  ];
  return (
    <section className="w-full bg-brand-oat px-4 sm:px-8 xl:px-16 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex flex-col gap-1.5 bg-white rounded-[1.25rem] sm:rounded-[1.75rem] border border-brand-brown/8 shadow-sm p-5 sm:p-7 hover:shadow-lg transition-shadow"
          >
            <span className="text-[11px] font-black tracking-[0.18em] uppercase text-brand-orange">{l.eyebrow}</span>
            <span className="font-serif text-xl sm:text-2xl text-brand-brown leading-snug">{l.title}</span>
            <span className="text-sm font-medium text-brand-brown/70">{l.body}</span>
            <span className="mt-2 text-xs font-black tracking-[0.12em] uppercase text-brand-brown group-hover:text-brand-orange">Read more →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const REVIEWS: { quote: string; name: string }[] = [
  {
    quote:
      "This homemade sourdough is absolutely incredible. Every time that I've ordered it, it's been consistently light, airy and super tasty. It's insane how they have new and unique flavours every week. I love all of them but a special shout out for their mango & bird eye chilli, paneer thecha and the hung curd chilli oil. Every bite is super delicious. Just warm it up and eat it plain or top it up with veggies/ cottage cheese/ tofu. It's just yummmm. Five stars all the way!!",
    name: "Pinky",
  },
  {
    quote:
      "Wild Wild Yeast has been such a lovely find. Every bake from Dnyanesh feels thoughtfully made, from the beautiful crackly crust to the soft, airy, flavourful crumb inside. We especially love the sourdoughs, my little one absolutely devours them, and watching her enjoy the pull of a warm slice, the crisp crust, and the burst of flavour has become such a sensory joy in itself. What makes Wild Wild Yeast stand out is the imagination behind the bakes. We've tried wonderfully unexpected combinations like mango chilli, lychee chilli, and chocolate chip cherry, flavours you would never imagine in sourdough, yet each one feels perfectly balanced and memorable. But beyond the novelty, it is the consistency and quality that keep us coming back. You can taste the care in every loaf: well-fermented, freshly baked, generous in flavour, and made with real attention to ingredients and craft.",
    name: "Priya T",
  },
  {
    quote:
      "Yumm… full of flavour, and there's something so special about having it straight out of the oven. It just warms the heart. Your sourdough brings that warm comfort of home. It's so good that all I need is a little butter, and I happily wipe the plate clean. It's become something we all genuinely look forward to.",
    name: "Vibha S",
  },
  {
    quote:
      "I've had the pleasure of enjoying the artisanal sourdough from Wild Wild Yeast for over a year now, and every loaf has been a delight. What I love most is the perfect balance of textures — a beautifully crisp crust with a soft, light, and flavourful interior. I also look forward to their creative flavour combinations, which are always unique, thoughtful, and often delightfully unexpected. It's clear that this brand has been built with passion, patience, and genuine craftsmanship.",
    name: "V.S.",
  },
  {
    quote:
      "Fizzy perfection! Tried the Hibiscus, Jamun, and Blueberry flavors from Wild Wild Yeast, and they are honestly so good. It's hard to find a ginger ale that gets the fizz exactly right, but these completely nail it. They're super refreshing on their own, but they also make the perfect mixers for a weekend drink. Packed with actual flavor and light enough to have anytime. Give them a try!",
    name: "S.P.",
  },
  {
    quote:
      "I wasn't expecting much when I first tried it, but it ended up becoming one of my favourite drinks. It's refreshing, has a nice natural ginger taste, and doesn't feel overly sugary. I usually keep a few bottles in the fridge because it's great on its own or with food. My family likes it too, so it doesn't last long in our house! I've reordered it a few times now because the taste and quality have been consistently good.",
    name: "A.M.",
  },
  {
    quote:
      "The best sourdough bread I have ever had. WWY offers a variety of flavours one cannot even imagine.. so fresh and flavourful.",
    name: "Mona B",
  },
  {
    quote:
      "Wild Wild Yeast has become a regular part of our week, and honestly, we still can't get enough. The breads are soft, flavorful, and the kind you keep going back to for \"just one more slice.\" Their ales are just as impressive — naturally fizzy, made from real ingredients and with little to no added sugar. It's rare to find something that tastes this good and still feels this wholesome.",
    name: "Pallavi & Hriday Dalal",
  },
  {
    quote:
      "WWY has created some truly amazing and unique sourdoughs! The bread arriving warm and crusty reminds of my neighbourhood bakery while growing up — a bright spot on my weekend morning.",
    name: "George Mathew",
  },
  {
    quote:
      "There are sourdough breads by the dozen and then there is the one made by WWY.. one made with passion and love .. way above the rest. Their breads come in unique flavours, never found anywhere else, like thecha flavour, honey chilli, Indore spice, Kolhapuri Masala and even Goan Masala. They also brew ales — which are excellent too. Best wishes to Wild Wild Yeast for wonderful success ahead.",
    name: "Shraddha and Parag Gude",
  },
  {
    quote:
      "Wild Wild Yeast has completely changed how I think about ginger ales and naturally fermented foods. The range of flavours is remarkably creative, yet every bottle and loaf feels balanced, fresh and true to the craft. There's a depth and complexity here that only comes from patient, natural fermentation, without ever feeling overdone. If you're looking for authentic, small-batch ales or exceptional sourdough in Mumbai, WWY is genuinely in a class of its own.",
    name: "Rahul M.",
  },
];

const AUTOPLAY_MS = 6000;
const PER_ROW = 5;
const PAGE_COUNT = Math.ceil(REVIEWS.length / PER_ROW);

export default function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setPage(((next % PAGE_COUNT) + PAGE_COUNT) % PAGE_COUNT);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".testimonials-heading",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: ".testimonials-heading", start: "top 85%" } }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (rowRef.current) {
      gsap.fromTo(
        rowRef.current.querySelectorAll(".testimonial-card"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
      );
    }
  }, [page]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => goTo(page + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [page, paused, goTo]);

  const items = Array.from({ length: PER_ROW }, (_, i) => REVIEWS[(page * PER_ROW + i) % REVIEWS.length]);

  return (
    <section
      ref={containerRef}
      className="w-full bg-white px-4 sm:px-8 xl:px-16 py-16 sm:py-24 border-t border-brand-charcoal/5"
    >
      <div className="max-w-7xl mx-auto">
        <span className="testimonials-heading text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block text-center">
          From the tables we&apos;ve reached
        </span>
        <h2
          className="testimonials-heading font-black text-brand-charcoal tracking-tight leading-none mb-12 sm:mb-16 text-center"
          style={{ fontSize: "clamp(2.2rem, 7vw, 4.5rem)" }}
        >
          WHAT PEOPLE <span className="text-brand-terracotta">ARE SAYING.</span>
        </h2>

        <div
          className="relative flex items-stretch gap-2 sm:gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            onClick={() => goTo(page - 1)}
            aria-label="Previous testimonials"
            className="shrink-0 self-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-oat/60 hover:bg-brand-terracotta hover:text-white text-brand-charcoal/60 flex items-center justify-center transition-colors duration-300 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            ref={rowRef}
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          >
            {items.map((review, i) => (
              <div
                key={`${page}-${i}`}
                className="testimonial-card min-h-[220px] flex flex-col bg-brand-oat/40 rounded-[1.5rem] p-5 border border-brand-charcoal/5"
              >
                <span className="text-brand-terracotta text-3xl font-serif leading-none block mb-2">&quot;</span>
                <p className="text-brand-charcoal/70 text-xs sm:text-[13px] font-bold leading-relaxed mb-4 line-clamp-6">
                  {review.quote}
                </p>
                <p className="mt-auto text-brand-charcoal font-black text-[11px] uppercase tracking-widest">{review.name}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => goTo(page + 1)}
            aria-label="Next testimonials"
            className="shrink-0 self-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-oat/60 hover:bg-brand-terracotta hover:text-white text-brand-charcoal/60 flex items-center justify-center transition-colors duration-300 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonials page ${i + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${i === page ? "w-6 h-1.5 bg-brand-terracotta" : "w-1.5 h-1.5 bg-brand-charcoal/15 hover:bg-brand-charcoal/30"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

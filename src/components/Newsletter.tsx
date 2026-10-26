"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Newsletter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("saving");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, consent }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".newsletter-reveal", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-brand-oat py-16 sm:py-32 md:py-40 relative overflow-hidden -mt-px z-20"
    >
      {/* Background Decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <h2
          className="font-serif font-black italic uppercase text-brand-charcoal leading-none whitespace-nowrap"
          style={{ fontSize: "clamp(8rem, 20vw, 25rem)" }}
        >
          THE SOCIETY
        </h2>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">

        {/* Badge */}
        <span className="newsletter-reveal text-brand-terracotta text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4 block">
          Join the Society
        </span>

        {/* Heading */}
        <div className="newsletter-reveal text-center mb-10 sm:mb-16">
          <h2
            className="font-black text-brand-charcoal tracking-tight leading-none mb-4 sm:mb-6"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
          >
            STAY IN THE <br className="hidden sm:block" />
            <span className="text-brand-terracotta">CULTURE.</span>
          </h2>
          <p className="max-w-xs sm:max-w-xl mx-auto text-brand-charcoal/70 text-sm sm:text-base font-medium leading-relaxed">
            New flavours and menu drops, sent to your WhatsApp when we open a window.
          </p>
        </div>

        {/* WhatsApp opt-in */}
        <div className="newsletter-reveal w-full max-w-xs sm:max-w-md md:max-w-2xl">
          {status === "done" ? (
            <p className="text-center font-serif italic text-brand-charcoal text-xl sm:text-2xl">
              You&apos;re in. We&apos;ll message you on WhatsApp when new bakes go up.
            </p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="relative group">
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-label="WhatsApp number"
                  placeholder="WhatsApp number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-brand-charcoal/20 py-4 sm:py-6 md:py-8 font-serif italic text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none transition-all duration-500 pr-16 sm:pr-20 peer"
                  style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}
                />
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-orange scale-x-0 peer-focus:scale-x-100 transition-transform duration-500 origin-center" />
                <button
                  type="submit"
                  aria-label="Join WhatsApp updates"
                  disabled={status === "saving" || !consent}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-brand-charcoal text-brand-oat flex items-center justify-center hover:bg-brand-orange hover:scale-105 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300"
                >
                  <ArrowRight size={20} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
                </button>
              </div>
              <label className="flex items-start gap-3 text-xs sm:text-sm font-medium text-brand-charcoal/70 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-brand-orange shrink-0"
                />
                <span>
                  I agree to receive menu and offer updates from Wild Wild Yeast on WhatsApp. I can opt out at any time.
                  See our <Link href="/privacy" className="underline">Privacy Policy</Link>.
                </span>
              </label>
              {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
            </form>
          )}
        </div>

      </div>
    </section>
  );
}

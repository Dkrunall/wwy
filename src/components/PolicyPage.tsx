import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Shared shell for the legal and policy pages. Server component; Navbar and Footer are client components.
export default function PolicyPage({
  eyebrow,
  title,
  updated = "October 2026",
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <section className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-44 pb-12 sm:pb-16 border-b border-brand-brown/5">
        <div className="max-w-3xl mx-auto">
          <span className="text-brand-orange text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3 block">{eyebrow}</span>
          <h1 className="font-serif font-normal text-brand-brown tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)" }}>
            {title}
          </h1>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-brown/30 mt-4">Last updated {updated}</p>
        </div>
      </section>
      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-5 text-sm sm:text-base font-medium text-brand-brown/75 leading-relaxed [&_h2]:font-serif [&_h2]:font-normal [&_h2]:text-2xl [&_h2]:text-brand-brown [&_h2]:mt-6 [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-brand-orange [&_a]:underline [&_strong]:text-brand-brown">
          {children}
        </div>
      </section>
      <Footer />
    </main>
  );
}

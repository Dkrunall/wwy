"use client";

import React from "react";
import Link from "next/link";
import { BUSINESS, businessValue } from "@/lib/business";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop",
    links: [
      ["/shop", "Shop all"],
      ["/subscribe", "Standing Order"],
      ["/gifting", "Gifting"],
      ["/flavour-lab", "Flavour Lab"],
    ],
  },
  {
    title: "Discover",
    links: [
      ["/story", "Our story"],
      ["/process", "Our process"],
      ["/faq", "FAQs"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/contact", "Contact"],
      ["/delivery", "Delivery"],
      ["/refund", "Refunds & cancellation"],
      ["/allergens", "Allergens"],
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      ["/cookies", "Cookies"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-brown text-white pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-14 overflow-hidden relative z-30 rounded-t-[2rem] sm:rounded-t-[3rem] md:rounded-t-[5rem] -mt-8 sm:-mt-12 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] border-t border-brand-brown/10">
      <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-8 xl:px-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-8 lg:gap-16">
          {/* Brand */}
          <div className="flex flex-col gap-3 lg:w-1/3">
            <h3 className="font-black text-brand-oat tracking-tighter leading-[1.05]" style={{ fontSize: "clamp(1.3rem, 3vw, 2rem)" }}>
              WILD BY NATURE.<br />
              <span className="text-brand-orange">CRAFTED BY TIME.</span>
            </h3>
            <p className="text-brand-oat/75 font-bold text-sm max-w-xs">Small-batch sourdough, baked twice a week in Mumbai.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-black tracking-[0.15em] uppercase">
              <Link href="/#newsletter" className="py-2 text-brand-orange hover:text-white transition-colors">Join the list →</Link>
              <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer" className="py-2 text-brand-oat/80 hover:text-brand-orange transition-colors normal-case tracking-normal">
                Instagram @{BUSINESS.instagramHandle}
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-4 sm:gap-10 lg:gap-14">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col text-[13px] sm:text-sm font-bold text-brand-oat/80">
                <span className="text-brand-orange text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase mb-1.5">{col.title}</span>
                {col.links.map(([href, label]) => (
                  <Link key={href + label} href={href} className="py-2 sm:py-1.5 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legal identity (Consumer Protection (E-Commerce) Rules 2020) */}
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-8 sm:mt-12 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-[11px] sm:text-xs font-bold text-brand-oat/65 leading-relaxed">
          <p>
            <span className="text-brand-oat/90 font-black">{BUSINESS.legalName}</span> · {businessValue(BUSINESS.registeredAddress)} · LLPIN {businessValue(BUSINESS.llpin)} · GSTIN{" "}
            {businessValue(BUSINESS.gstin)} · FSSAI {businessValue(BUSINESS.fssai)}
          </p>
          <p>
            <span className="text-brand-oat/90 font-black">Customer care</span> · {BUSINESS.carePhone} · {businessValue(BUSINESS.careEmail)}
          </p>
          <p>
            <span className="text-brand-oat/90 font-black">Grievance officer</span> · {businessValue(BUSINESS.grievanceOfficer.name)} · {businessValue(BUSINESS.grievanceOfficer.email)} ·{" "}
            {businessValue(BUSINESS.grievanceOfficer.phone)}
          </p>
        </div>

        <p className="max-w-7xl mx-auto mt-6 text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-brand-oat/70">
          © 2026 Wild Wild Yeast. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

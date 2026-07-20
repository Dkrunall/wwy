"use client";
 
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPost } from "@/lib/journal";
 
const categoryColors: Record<string, string> = {
  Process:     "bg-brand-terracotta/10 text-brand-terracotta",
  Ingredients: "bg-brand-gold/20 text-amber-700",
  Culture:     "bg-brand-charcoal/10 text-brand-charcoal",
  Recipes:     "bg-[#D1E8E2] text-brand-olive",
};
 
export default function JournalArticlePage() {
  const params = useParams();
  const router = useRouter();
  const post = getPost(Number(params.id));
 
  if (!post) {
    return (
      <main className="min-h-screen bg-brand-oat flex flex-col items-center justify-center gap-6 px-5">
        <p
          className="font-serif font-normal text-brand-charcoal/40 tracking-tight text-3xl text-center"
        >
          Note not found.
        </p>
        <Link
          href="/journal"
          className="bg-brand-charcoal text-white font-black text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-brand-terracotta transition-colors duration-300"
        >
          ← Back to Journal
        </Link>
      </main>
    );
  }
 
  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
 
      {/* Hero image */}
      <section
        className="w-full relative bg-brand-charcoal overflow-hidden"
        style={{ height: "clamp(350px, 55vw, 600px)" }}
      >
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-transparent" />
 
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-28 left-5 sm:left-8 xl:left-16 z-20 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase">Back</span>
        </button>
 
        {/* Meta + title overlay */}
        <div className="absolute bottom-10 left-5 sm:left-8 xl:left-16 right-5 sm:right-8 xl:right-16 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-[9px] font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full ${categoryColors[post.category] ?? "bg-white/10 text-white"}`}
            >
              {post.category}
            </span>
            <span className="text-[10px] font-bold text-white/60">{post.date}</span>
            <span className="text-white/30 text-[10px]">·</span>
            <span className="text-[10px] font-bold text-white/60">{post.readTime} read</span>
          </div>
          <h1
            className="font-serif font-normal text-brand-oat tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(2rem, 6vw, 4.2rem)" }}
          >
            {post.title}
          </h1>
        </div>
      </section>
 
      {/* Article body */}
      <article className="w-full px-5 sm:px-8 xl:px-16 py-16 sm:py-24 max-w-3xl mx-auto">
        <p className="font-serif italic font-normal text-brand-charcoal/70 leading-relaxed mb-10 text-lg sm:text-xl md:text-2xl border-l-2 border-brand-orange pl-6">
          {post.excerpt}
        </p>
 
        <div className="flex flex-col gap-6 text-base sm:text-lg font-medium text-brand-charcoal/80 leading-[1.8] tracking-normal">
          {post.body.map((paragraph, i) => (
            <p key={i}>
              {paragraph}
            </p>
          ))}
        </div>
 
        <div className="mt-16 pt-8 border-t border-brand-charcoal/10">
          <Link
            href="/journal"
            className="inline-flex items-center gap-3 text-brand-charcoal/40 hover:text-brand-terracotta font-black text-xs tracking-[0.2em] uppercase transition-colors duration-300"
          >
            <ArrowLeft size={14} />
            All Notes
          </Link>
        </div>
      </article>
 
      {/* CTA */}
      <section className="w-full bg-brand-oat border-t border-brand-charcoal/5 px-4 sm:px-8 xl:px-16 py-16 sm:py-20 text-center">
        <span className="text-brand-terracotta text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-3 block">
          Stay in the Culture
        </span>
        <h3
          className="font-serif font-normal text-brand-charcoal tracking-tight leading-[1.05] mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          More notes, <span className="text-brand-terracotta italic font-light">when ready.</span>
        </h3>
        <Link
          href="/journal"
          className="inline-block bg-brand-charcoal text-white hover:bg-brand-terracotta px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-md transition-all duration-300 active:scale-95"
        >
          Read All Notes
        </Link>
      </section>
 
      <Footer />
    </main>
  );
}

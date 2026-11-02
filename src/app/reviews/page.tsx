import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import { REVIEWS } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Customer Reviews | Wild Wild Yeast",
  description: "Discover customer feedback on Wild Wild Yeast sourdough and bakes. Explore favourites from our bakery community.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <PageBanner
        eyebrow="Customer reviews"
        title="Don't just take our word for it."
        intro="Good bread creates its own kind of following. Explore what customers are saying about their favourite Wild Wild Yeast bakes, from the first slice to the last crumb."
        image="/product_img/8-the-crust.jpg"
      />

      <section className="w-full px-4 sm:px-8 xl:px-16 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif font-normal text-2xl sm:text-3xl text-brand-brown tracking-tight mb-8">What everyone&apos;s talking about</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REVIEWS.map((r) => (
              <figure key={r.name + r.quote.slice(0, 20)} className="bg-white rounded-[2rem] border border-brand-brown/5 shadow-sm p-6 sm:p-8 flex flex-col gap-4">
                <blockquote className="text-sm sm:text-base font-medium text-brand-brown/75 leading-relaxed">{r.quote}</blockquote>
                <figcaption className="mt-auto text-[11px] font-black uppercase tracking-widest text-brand-brown">{r.name}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/shop"
              className="inline-flex bg-brand-brown text-white hover:bg-brand-orange px-8 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-colors active:scale-95 shadow-lg"
            >
              Find your favourite
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

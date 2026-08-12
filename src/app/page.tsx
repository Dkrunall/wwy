"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProcessStory from "@/components/ProcessStory";
import StorySection from "@/components/StorySection";
import MenuSection from "@/components/MenuSection";
import EnergyBanner from "@/components/EnergyBanner";
import Testimonials from "@/components/Testimonials";
import SocialGallery from "@/components/SocialGallery";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useEffect(() => {
    // Global layout refresh to fix ScrollTrigger miscalculations
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative bg-brand-cream">
      <Navbar />
      <Hero />
      <ProcessStory />
      <StorySection />
      <MenuSection />
      <EnergyBanner />
      <Testimonials />
      <SocialGallery />
      <Newsletter />
      <Footer />
      <CartDrawer />
    </main>
  );
}


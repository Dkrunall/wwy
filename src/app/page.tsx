import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HomeMenu from "@/components/HomeMenu";
import Testimonials from "@/components/Testimonials";
import SocialGallery from "@/components/SocialGallery";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { HowItWorksStrip, ExploreLinks } from "@/components/HomeSections";
import { getMenuData } from "@/lib/menuData";

export const revalidate = 60;

// Homepage: hero, what's baking, how ordering works, reviews, then short links to the rest.
export default async function Home() {
  const menu = await getMenuData();
  return (
    <main className="relative bg-brand-cream">
      <Navbar />
      <Hero />
      <HomeMenu {...menu} />
      <HowItWorksStrip />
      <Testimonials />
      <ExploreLinks />
      <SocialGallery />
      <Newsletter />
      <Footer />
    </main>
  );
}

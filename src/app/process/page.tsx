import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "How We Make Sourdough | Wild Wild Yeast Mumbai",
  description:
    "Learn about sourdough fermentation, small-batch baking and the process behind Wild Wild Yeast's flavour-led bakes in Mumbai.",
  alternates: { canonical: "/process" },
};

export default function ProcessPage() {
  return (
    <PolicyPage
      eyebrow="Our process"
      title="Good things take their time."
      showUpdated={false}
      intro="Sourdough isn't a race. And that's rather the point."
    >
      <p>
        A good loaf comes together through a process that rewards patience, attention and an understanding of how ingredients work together.
        At Wild Wild Yeast, the craft of fermentation meets a curiosity for flavour, resulting in bakes designed to make everyday eating more
        interesting.
      </p>

      <h2>Step 1: Start with the starter</h2>
      <p>
        Sourdough begins with a starter, a culture of wild yeast and bacteria kept going with flour and water. This culture helps drive
        fermentation and contributes to the distinctive character of sourdough bread.
      </p>

      <h2>Step 2: Give it time</h2>
      <p>
        Fermentation is an essential part of the process. Time, temperature and the way the dough is handled all influence how it develops.
        Our loaves ferment for 12 to 24 hours.
      </p>

      <h2>Step 3: Shape the character</h2>
      <p>From the handling of the dough to the final bake, each stage contributes to the loaf&apos;s texture, structure and flavour.</p>

      <h2>Step 4: Keep exploring</h2>
      <p>
        At Wild Wild Yeast, traditional sourdough craft meets curiosity about flavour. Our approach brings together the fundamentals of
        fermentation with a willingness to experiment with new combinations.
      </p>

      <h2>Curious about the results?</h2>
      <p>
        Explore our <Link href="/order?category=Crafted%20Bakes">Crafted Bakes</Link> and discover what fermentation and flavour can bring to your
        table. We bake twice a week, bringing fresh batches to your doorstep according to our baking and delivery schedule.
      </p>
    </PolicyPage>
  );
}

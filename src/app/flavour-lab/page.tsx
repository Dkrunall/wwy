import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { FLAVOURS } from "@/lib/flavours";
import { scheduleWindows, cutoffRuleText } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "This Week's Sourdough Flavours | Wild Wild Yeast Mumbai",
  description:
    "Discover the latest flavoured sourdough and small-batch bakes from Wild Wild Yeast in Mumbai. Explore current flavours, check the latest batch and order fresh bakes for delivery.",
  alternates: { canonical: "/flavour-lab" },
};

export default function FlavourLabPage() {
  const windows = scheduleWindows();
  return (
    <PolicyPage
      eyebrow="Flavour Lab"
      title="Meet the latest batch."
      showUpdated={false}
      bannerImage="/new-catelog/sweet-sourdough.png"
      intro="The classics are classics for a reason. But there's always room for something unexpected."
    >
      <p>
        Welcome to the Flavour Lab, where we explore new flavour combinations, experiment with the familiar and give sourdough a few new ways to
        surprise you. We bake twice a week, keeping the experience rooted in freshness, flavour and the joy of discovering something new.
      </p>

      <h2>What&apos;s in the mix?</h2>
      <p>Every batch has its own personality. These are the flavours our customers have been talking about. Flavours rotate, so check the shop for what is available now.</p>
      <ul>
        {FLAVOURS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p>New flavours go up every week on Instagram, so keep an eye out.</p>

      <h2>Next available bake</h2>
      <ul>
        {windows.map((w) => (
          <li key={w.delivery}>
            <strong>{w.delivery} delivery:</strong> order by {w.time} on {w.cutoff}.
          </li>
        ))}
      </ul>
      <p>Orders close {cutoffRuleText()}.</p>

      <h2>Same curiosity. Different batch.</h2>
      <p>
        We&apos;re always exploring new ideas, which means the range may change as new flavours arrive. Found a favourite? Make it part of your
        routine. Spotted something new? This is your sign to give it a try.
      </p>
      <p>
        <Link href="/shop">Shop all bakes</Link>
      </p>
    </PolicyPage>
  );
}

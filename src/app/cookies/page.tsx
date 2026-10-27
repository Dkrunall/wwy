import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies and browser storage wildwildyeast.com uses to keep you signed in and remember your cart.",
};

export default function CookiesPage() {
  return (
    <PolicyPage eyebrow="Legal" title="Cookie Policy">
      <p>
        We use only the cookies and browser storage the site needs to work. We do not run advertising or analytics trackers on this site.
      </p>

      <h2>What we store in your browser</h2>
      <ul>
        <li><strong>Sign-in session.</strong> Keeps you logged in to your account after you verify your email.</li>
        <li><strong>Cart and delivery details.</strong> Your cart, name, flat and pincode are remembered on your device so you do not retype them. They are not sent anywhere until you check out.</li>
        <li><strong>Payment.</strong> Razorpay may set its own cookies on its payment window to process and secure your payment. See Razorpay&apos;s policy for details.</li>
      </ul>

      <h2>Choosing what is stored</h2>
      <p>
        You can clear cookies and site data in your browser settings at any time. If you block them completely, you will not be able to sign in
        or keep items in your cart.
      </p>

      <h2>More about your data</h2>
      <p>
        How we handle your personal data is in our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </PolicyPage>
  );
}

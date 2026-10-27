"use client";

import React, { useState } from "react";

// Gifting and corporate enquiry (P3-3). Opens WhatsApp with the details filled in, so it needs no backend.
export default function GiftingForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [form, setForm] = useState({ name: "", company: "", quantity: "", date: "", budget: "", notes: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      "Hi Wild Wild Yeast! I'd like to enquire about gifting.",
      `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      `Quantity: ${form.quantity}`,
      `Delivery date: ${form.date}`,
      form.budget && `Budget: ${form.budget}`,
      form.notes && `Notes: ${form.notes}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  const field = "w-full bg-white border border-brand-brown/15 rounded-2xl px-4 py-3 text-sm font-bold text-brand-brown placeholder:text-brand-brown/30 outline-none focus:border-brand-orange";
  const label = "text-[10px] font-black tracking-[0.18em] uppercase text-brand-brown/50 mb-1.5 block";

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="g-name" className={label}>Your name</label>
        <input id="g-name" required value={form.name} onChange={set("name")} className={field} placeholder="Full name" />
      </div>
      <div>
        <label htmlFor="g-company" className={label}>Company (optional)</label>
        <input id="g-company" value={form.company} onChange={set("company")} className={field} placeholder="Company name" />
      </div>
      <div>
        <label htmlFor="g-qty" className={label}>Quantity</label>
        <input id="g-qty" required inputMode="numeric" value={form.quantity} onChange={set("quantity")} className={field} placeholder="Number of hampers" />
      </div>
      <div>
        <label htmlFor="g-date" className={label}>Delivery date</label>
        <input id="g-date" required type="date" value={form.date} onChange={set("date")} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="g-budget" className={label}>Budget (optional)</label>
        <input id="g-budget" value={form.budget} onChange={set("budget")} className={field} placeholder="e.g. ₹1,000 per hamper" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="g-notes" className={label}>Anything else (optional)</label>
        <textarea id="g-notes" rows={3} value={form.notes} onChange={set("notes")} className={field} placeholder="Occasion, dietary needs, branding" />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand-brown text-white hover:bg-brand-orange px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-colors active:scale-95 shadow-lg"
        >
          Send enquiry on WhatsApp
        </button>
      </div>
    </form>
  );
}

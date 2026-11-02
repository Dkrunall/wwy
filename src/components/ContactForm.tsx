"use client";

import React, { useState } from "react";

const TOPICS = ["Order support", "Delivery", "Product question", "Collaboration or business", "Something else"];

// Contact form. Opens WhatsApp with the details filled in, so it needs no backend (same approach as the gifting form).
export default function ContactForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [form, setForm] = useState({ name: "", email: "", order: "", topic: TOPICS[0], message: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      "Hi Wild Wild Yeast!",
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.order && `Order number: ${form.order}`,
      `About: ${form.topic}`,
      `Message: ${form.message}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  const field = "w-full bg-white border border-brand-brown/15 rounded-2xl px-4 py-3 text-sm font-bold text-brand-brown placeholder:text-brand-brown/30 outline-none focus:border-brand-orange";
  const label = "text-[10px] font-black tracking-[0.18em] uppercase text-brand-brown/50 mb-1.5 block";

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
      <div>
        <label htmlFor="c-name" className={label}>Name</label>
        <input id="c-name" required autoComplete="name" value={form.name} onChange={set("name")} className={field} />
      </div>
      <div>
        <label htmlFor="c-email" className={label}>Email address</label>
        <input id="c-email" required type="email" autoComplete="email" value={form.email} onChange={set("email")} className={field} />
      </div>
      <div>
        <label htmlFor="c-order" className={label}>Order number (optional)</label>
        <input id="c-order" value={form.order} onChange={set("order")} className={field} placeholder="WWY-2026-0000" />
      </div>
      <div>
        <label htmlFor="c-topic" className={label}>What can we help you with?</label>
        <select id="c-topic" value={form.topic} onChange={set("topic")} className={field}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-message" className={label}>Message</label>
        <textarea id="c-message" required rows={4} value={form.message} onChange={set("message")} className={field} />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand-brown text-white hover:bg-brand-orange px-10 py-4 rounded-full text-xs font-black tracking-[0.2em] uppercase transition-colors active:scale-95 shadow-lg"
        >
          Send your message
        </button>
        <p className="text-xs font-bold text-brand-brown/40 mt-3">Please include your order number when contacting us about an existing purchase. This opens WhatsApp with your message ready to send.</p>
      </div>
    </form>
  );
}

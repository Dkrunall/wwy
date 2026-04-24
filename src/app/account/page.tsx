"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package, User, MapPin, LogOut, ChevronRight,
  ShoppingBag, Clock, CheckCircle, Truck, Plus, Pencil, Trash2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

/* ── Static demo data ── */
const demoOrders = [
  {
    id: "WWY-10042",
    date: "18 Apr 2026",
    status: "delivered",
    total: "₹1,380",
    items: [
      { name: "Wild Botanicals", qty: 2, image: "/p1.png", bgColor: "bg-[#FFDDC1]" },
      { name: "Golden Fizz", qty: 1, image: "/p3.png", bgColor: "bg-[#FCEEA7]" },
    ],
  },
  {
    id: "WWY-10031",
    date: "03 Apr 2026",
    status: "in_transit",
    total: "₹850",
    items: [
      { name: "The Iron Tin", qty: 1, image: "/p4.png", bgColor: "bg-[#E2D4E0]" },
    ],
  },
  {
    id: "WWY-10019",
    date: "21 Mar 2026",
    status: "processing",
    total: "₹1,200",
    items: [
      { name: "Sampler Kit", qty: 1, image: "/p5.png", bgColor: "bg-[#FFDDC1]" },
    ],
  },
];

const demoAddresses = [
  {
    id: 1,
    label: "Home",
    default: true,
    line1: "12B, Pali Hill Road",
    line2: "Bandra West, Mumbai — 400050",
    phone: "+91 98765 43210",
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  delivered:   { label: "Delivered",   color: "bg-brand-olive/10 text-brand-olive",         icon: <CheckCircle size={12} /> },
  in_transit:  { label: "In Transit",  color: "bg-brand-gold/20 text-amber-700",             icon: <Truck size={12} /> },
  processing:  { label: "Processing",  color: "bg-brand-charcoal/10 text-brand-charcoal/60", icon: <Clock size={12} /> },
};

const tabs = [
  { id: "orders",    label: "Orders",    icon: Package },
  { id: "profile",   label: "Profile",   icon: User    },
  { id: "addresses", label: "Addresses", icon: MapPin  },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [profile, setProfile] = useState({
    firstName: "Arjun", lastName: "Sharma",
    email: "arjun@email.com", phone: "+91 98765 43210",
  });
  const [addresses, setAddresses] = useState(demoAddresses);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      {/* ── Hero Banner ── */}
      <div className="w-full bg-brand-charcoal relative overflow-hidden pt-36 sm:pt-40 pb-14 sm:pb-20 px-4 sm:px-8 xl:px-16">
        <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-terracotta/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-3 block">
              My Account
            </span>
            <h1
              className="font-black text-brand-oat tracking-tighter leading-none"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
            >
              WELCOME BACK,<br />
              <span className="text-brand-terracotta">{profile.firstName.toUpperCase()}.</span>
            </h1>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 sm:gap-6">
            {[
              { label: "Orders", value: demoOrders.length },
              { label: "Provisions", value: "4 SKUs" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-center">
                <p className="font-black text-xl sm:text-2xl text-brand-oat">{value}</p>
                <p className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-oat/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="w-full px-4 sm:px-8 xl:px-16 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-brand-charcoal/5 sticky top-32">

              {/* Avatar + name */}
              <div className="flex items-center gap-3 px-4 py-4 mb-1">
                <div className="w-10 h-10 rounded-full bg-[#FFDDC1] flex items-center justify-center font-black text-brand-charcoal text-lg shrink-0 shadow-inner">
                  {profile.firstName[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs tracking-[0.1em] uppercase text-brand-charcoal truncate">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-[10px] text-brand-charcoal/40 font-bold truncate">{profile.email}</p>
                </div>
              </div>

              <div className="h-px bg-brand-charcoal/5 mx-2 mb-2" />

              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200 ${
                    activeTab === id
                      ? "bg-brand-charcoal text-white"
                      : "text-brand-charcoal/50 hover:bg-brand-charcoal/5 hover:text-brand-charcoal"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {activeTab === id && <ChevronRight size={12} className="ml-auto" />}
                </button>
              ))}

              <div className="h-px bg-brand-charcoal/5 mx-2 my-2" />

              <Link
                href="/login"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta hover:bg-brand-terracotta/5 transition-all duration-200"
              >
                <LogOut size={14} />
                Sign Out
              </Link>
            </div>
          </aside>

          {/* ── Main Panel ── */}
          <div className="flex-1 min-w-0">

            {/* ORDERS */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal">
                    Order History
                  </h2>
                  <span className="text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/30">
                    {demoOrders.length} orders
                  </span>
                </div>

                {demoOrders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm overflow-hidden"
                    >
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-brand-charcoal/5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <span className="font-black text-xs tracking-[0.15em] uppercase text-brand-charcoal">
                            {order.id}
                          </span>
                          <span className="text-[10px] font-bold text-brand-charcoal/40">{order.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] uppercase ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          <span className="font-black text-sm text-brand-charcoal">{order.total}</span>
                        </div>
                      </div>

                      {/* Order items */}
                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {order.items.map((item, i) => (
                              <div
                                key={i}
                                className={`w-12 h-12 rounded-full ${item.bgColor} border-2 border-white flex items-center justify-center shrink-0 relative shadow-sm`}
                              >
                                <div className="relative w-8 h-8">
                                  <Image src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs font-black text-brand-charcoal">
                              {order.items.map(i => i.name).join(", ")}
                            </p>
                            <p className="text-[10px] font-bold text-brand-charcoal/40 mt-0.5">
                              {order.items.reduce((s, i) => s + i.qty, 0)} {order.items.reduce((s, i) => s + i.qty, 0) === 1 ? "item" : "items"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {order.status === "delivered" && (
                            <button className="px-5 py-2.5 rounded-full bg-brand-charcoal/5 hover:bg-brand-charcoal hover:text-white text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal transition-all duration-200 active:scale-95">
                              Reorder
                            </button>
                          )}
                          <button className="px-5 py-2.5 rounded-full bg-brand-charcoal/5 hover:bg-brand-terracotta/10 hover:text-brand-terracotta text-[10px] font-black tracking-[0.15em] uppercase text-brand-charcoal/50 transition-all duration-200 active:scale-95">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* CTA */}
                <div className="mt-2 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40 hover:text-brand-terracotta transition-colors"
                  >
                    <ShoppingBag size={12} />
                    Browse more provisions
                  </Link>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-2">
                  Profile Details
                </h2>

                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">

                  {/* Avatar row */}
                  <div className="flex items-center gap-5 mb-8 pb-8 border-b border-brand-charcoal/5">
                    <div className="w-16 h-16 rounded-full bg-[#FFDDC1] flex items-center justify-center font-black text-brand-charcoal text-2xl shadow-inner shrink-0">
                      {profile.firstName[0]}
                    </div>
                    <div>
                      <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal mb-1">
                        {profile.firstName} {profile.lastName}
                      </p>
                      <p className="text-xs text-brand-charcoal/40 font-bold">Member since March 2026</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">First Name</label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Last Name</label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={handleSave}
                        className="bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 shadow-md"
                      >
                        {saved ? "Saved ✓" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">
                  <h3 className="font-black text-xs tracking-[0.15em] uppercase text-brand-charcoal mb-5">Change Password</h3>
                  <div className="flex flex-col gap-4">
                    {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                      <div key={label} className="flex flex-col gap-2">
                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">{label}</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors"
                        />
                      </div>
                    ))}
                    <button className="self-start bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 shadow-md mt-1">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal">
                    Saved Addresses
                  </h2>
                  <button className="flex items-center gap-2 bg-brand-charcoal text-white hover:bg-brand-terracotta px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200 active:scale-95 shadow-sm">
                    <Plus size={12} />
                    Add New
                  </button>
                </div>

                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start justify-between gap-5"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-brand-charcoal/5 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-brand-charcoal/40" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-xs tracking-[0.15em] uppercase text-brand-charcoal">
                            {addr.label}
                          </span>
                          {addr.default && (
                            <span className="bg-brand-terracotta text-white text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-brand-charcoal/70 leading-relaxed">
                          {addr.line1}<br />{addr.line2}
                        </p>
                        <p className="text-xs font-bold text-brand-charcoal/40 mt-1">{addr.phone}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal/5 hover:bg-brand-charcoal hover:text-white text-[10px] font-black tracking-[0.1em] uppercase text-brand-charcoal/50 transition-all duration-200">
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal/5 hover:bg-brand-terracotta/10 hover:text-brand-terracotta text-[10px] font-black tracking-[0.1em] uppercase text-brand-charcoal/50 transition-all duration-200"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {addresses.length === 0 && (
                  <div className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm flex flex-col items-center justify-center py-24 gap-5 text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-brand-charcoal/5 flex items-center justify-center">
                      <MapPin size={28} className="text-brand-charcoal/20" />
                    </div>
                    <div>
                      <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/30 mb-2">No addresses saved.</p>
                      <p className="text-xs text-brand-charcoal/30 font-medium">Add an address at checkout for faster delivery.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

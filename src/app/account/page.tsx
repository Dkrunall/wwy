"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, User, MapPin, LogOut, ChevronRight, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

const tabs = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <main className="min-h-screen bg-brand-oat">
      <Navbar />
      <CartDrawer />

      <div className="w-full px-4 sm:px-8 xl:px-16 pt-36 sm:pt-40 pb-24">

        {/* Page Header */}
        <div className="mb-10 sm:mb-14">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-brand-terracotta mb-3 block">
            My Account
          </span>
          <h1
            className="font-black text-brand-charcoal tracking-tighter leading-none"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
          >
            WELCOME BACK.
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-brand-charcoal/5">

              {/* User pill */}
              <div className="flex items-center gap-3 px-4 py-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#FFDDC1] flex items-center justify-center font-black text-brand-charcoal text-lg shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs tracking-[0.1em] uppercase text-brand-charcoal truncate">Arjun Sharma</p>
                  <p className="text-[10px] text-brand-charcoal/40 font-bold truncate">arjun@email.com</p>
                </div>
              </div>

              <div className="h-px bg-brand-charcoal/5 mx-2 mb-2" />

              {/* Nav items */}
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

              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-[10px] font-black tracking-[0.15em] uppercase text-brand-terracotta hover:bg-brand-terracotta/5 transition-all duration-200">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1">

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-4">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-2">
                  Order History
                </h2>

                {/* Empty state */}
                <div className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm flex flex-col items-center justify-center py-24 gap-5 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-brand-charcoal/5 flex items-center justify-center">
                    <ShoppingBag size={28} className="text-brand-charcoal/20" />
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/30 mb-2">
                      No orders yet.
                    </p>
                    <p className="text-xs text-brand-charcoal/30 font-medium leading-relaxed">
                      Your slow-fermented provisions will appear here.
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="mt-2 bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95"
                  >
                    Shop the Range
                  </Link>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-2">
                  Profile Details
                </h2>

                <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-brand-charcoal/5">
                  <div className="flex flex-col gap-5">

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">First Name</label>
                        <input
                          type="text"
                          defaultValue="Arjun"
                          className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Last Name</label>
                        <input
                          type="text"
                          defaultValue="Sharma"
                          className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Email</label>
                      <input
                        type="email"
                        defaultValue="arjun@email.com"
                        className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal focus:outline-none focus:border-brand-terracotta transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-charcoal/40">Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 00000 00000"
                        className="w-full bg-brand-oat border border-brand-charcoal/10 rounded-full px-5 py-3.5 text-sm font-bold text-brand-charcoal placeholder:text-brand-charcoal/25 focus:outline-none focus:border-brand-terracotta transition-colors"
                      />
                    </div>

                    <button className="self-start bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95 shadow-md mt-2">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-4">
                <h2 className="font-black text-sm tracking-[0.18em] uppercase text-brand-charcoal mb-2">
                  Saved Addresses
                </h2>

                <div className="bg-white rounded-[2rem] border border-brand-charcoal/5 shadow-sm flex flex-col items-center justify-center py-24 gap-5 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-brand-charcoal/5 flex items-center justify-center">
                    <MapPin size={28} className="text-brand-charcoal/20" />
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-[0.1em] uppercase text-brand-charcoal/30 mb-2">
                      No addresses saved.
                    </p>
                    <p className="text-xs text-brand-charcoal/30 font-medium">
                      Add an address at checkout for faster delivery.
                    </p>
                  </div>
                  <button className="mt-2 bg-brand-charcoal text-white hover:bg-brand-terracotta px-8 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 active:scale-95">
                    Add Address
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

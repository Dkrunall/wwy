"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, ClipboardList, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/order",         label: "Dashboard",  Icon: LayoutDashboard, exact: true },
  { href: "/order/shop",    label: "Order Now",   Icon: ShoppingBag,     exact: false },
  { href: "/order/history", label: "My Orders",   Icon: ClipboardList,   exact: false },
];

const NO_SIDEBAR = ["/order/login", "/order/cart", "/order/confirm"];

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [flat, setFlat] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const noSidebar = NO_SIDEBAR.some((p) => pathname === p || pathname.startsWith(p + "?"));

  useEffect(() => {
    setCustomerName(localStorage.getItem("wwy_name") || "");
    setFlat(localStorage.getItem("wwy_flat") || "");
  }, [pathname]);

  const handleLogout = async () => {
    ["wwy_flat","wwy_name","wwy_customer_id","wwy_pincode","wwy_cart"].forEach((k) => localStorage.removeItem(k));
    await supabase.auth.signOut();
    router.replace("/order/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (noSidebar) return <>{children}</>;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-brown/10">
        <div className="bg-brand-oat p-2 rounded-xl shrink-0">
          <Image src="/logo.png" alt="WWY" width={30} height={30} className="object-contain" />
        </div>
        <div>
          <p className="font-black text-brand-brown text-sm leading-none">Wild Wild Yeast</p>
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-orange mt-0.5">My Account</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-brand-brown/10 bg-brand-oat/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-brown text-white font-black text-sm flex items-center justify-center shrink-0">
            {customerName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-black text-brand-brown text-sm leading-none truncate">{customerName || "—"}</p>
            <p className="text-[10px] font-bold text-brand-brown/40 mt-0.5">Flat {flat}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-4 flex-1">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-200
                ${active
                  ? "bg-brand-brown text-white shadow-md shadow-brand-brown/10"
                  : "text-brand-brown/50 hover:text-brand-brown hover:bg-brand-brown/5"}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-orange" : "text-brand-brown/30"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-brand-brown/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase text-brand-brown/40 hover:text-rose-600 hover:bg-rose-50 transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-brand-oat">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-brand-brown/10 fixed inset-y-0 left-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-brand-brown/10 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-brand-oat p-1.5 rounded-xl shrink-0">
              <Image src="/logo.png" alt="WWY" width={24} height={24} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-brand-brown text-sm leading-none truncate">Wild Wild Yeast</p>
              <p className="text-[9px] font-bold text-brand-brown/40 mt-0.5 uppercase tracking-wider">
                {NAV.find((n) => isActive(n.href, n.exact))?.label || "My Account"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-brand-brown text-white font-black text-xs flex items-center justify-center shrink-0">
              {customerName?.[0]?.toUpperCase() || "?"}
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="w-8 h-8 rounded-xl bg-brand-oat flex items-center justify-center hover:bg-brand-brown/10 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4 text-brand-brown" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-xl bg-brand-oat flex items-center justify-center"
              >
                <X className="w-4 h-4 text-brand-brown" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <div className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </div>
    </div>
  );
}

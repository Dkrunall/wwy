"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Coffee, Users, Flame, BarChart2, Star, Settings,
  Bell, Activity, RefreshCw, LogOut, Menu, X, Tag,
} from "lucide-react";

export type OmsTab = "orders" | "products" | "coupons" | "customers" | "bakers" | "analytics" | "feedback" | "settings";

export const OMS_NAV: { key: OmsTab; icon: React.ElementType; label: string }[] = [
  { key: "orders", icon: ShoppingBag, label: "Orders" },
  { key: "products", icon: Coffee, label: "Products" },
  { key: "coupons", icon: Tag, label: "Coupons" },
  { key: "customers", icon: Users, label: "Customers" },
  { key: "bakers", icon: Flame, label: "Bakers" },
  { key: "analytics", icon: BarChart2, label: "Analytics" },
  { key: "feedback", icon: Star, label: "Feedback" },
  { key: "settings", icon: Settings, label: "Settings" },
];

interface OmsSidebarProps {
  activeTab: OmsTab;
  onTabSelect?: (tab: OmsTab) => void;
  unreadCount: number;
  onBellClick?: () => void;
  vacationMode: boolean;
  vacationLoading: boolean;
  onToggleVacation: () => void;
  onCron: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  mobileTitle?: string;
}

export default function OmsSidebar({
  activeTab, onTabSelect, unreadCount, onBellClick,
  vacationMode, vacationLoading, onToggleVacation,
  onCron, onRefresh, refreshing, onLogout,
  mobileMenuOpen, setMobileMenuOpen, mobileTitle = "WWY Desk",
}: OmsSidebarProps) {
  const NavItem = ({ t, Icon, label, onClick }: { t: OmsTab; Icon: React.ElementType; label: string; onClick: () => void }) => {
    const active = activeTab === t;
    const cls = `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer ${active ? "bg-brand-brown text-white shadow-md shadow-brand-brown/10 scale-[1.02]" : "text-brand-brown/65 hover:text-brand-brown hover:bg-brand-brown/5"}`;
    if (onTabSelect) {
      return <button onClick={onClick} className={cls}><Icon className={`w-4 h-4 ${active ? "text-brand-orange animate-pulse" : "text-brand-brown/30"}`} />{label}</button>;
    }
    return <Link href={`/oms?tab=${t}`} onClick={onClick} className={cls}><Icon className={`w-4 h-4 ${active ? "text-brand-orange animate-pulse" : "text-brand-brown/30"}`} />{label}</Link>;
  };

  return (
    <>
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden md:flex flex-col w-72 bg-white text-brand-brown border-r border-brand-brown/10 fixed inset-y-0 left-0 p-6 z-30 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/oms" className="flex items-center gap-3">
            <div className="bg-brand-brown/5 p-2 rounded-2xl"><Image src="/WWY-LOGO_White.png" alt="WWY" width={34} height={34} className="object-contain" /></div>
            <div><h1 className="font-serif text-lg font-black text-brand-brown leading-tight">Wild Wild Yeast</h1><span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-orange">Order Desk</span></div>
          </Link>
          <button onClick={onBellClick} className="relative p-2 rounded-xl hover:bg-brand-brown/5 transition-colors shrink-0 cursor-pointer">
            <Bell className="w-4 h-4 text-brand-brown/50" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
        </div>
        <nav className="flex flex-col gap-1.5 flex-grow">
          {OMS_NAV.map(({ key: t, icon: Icon, label }) => (
            <NavItem key={t} t={t} Icon={Icon} label={label} onClick={() => onTabSelect?.(t)} />
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-brand-brown/10 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-brand-brown/5 rounded-2xl px-4 py-2.5 border border-brand-brown/5">
            <div><span className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40 block">Oven Status</span><span className="text-[10px] font-bold text-brand-brown">{vacationMode ? "🌾 On Break" : "Active"}</span></div>
            <button onClick={onToggleVacation} disabled={vacationLoading} className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${vacationMode ? "bg-brand-orange" : "bg-brand-brown/20"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${vacationMode ? "translate-x-5" : "translate-x-1"}`} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onCron} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-brown/5 border border-brand-brown/5 text-[9px] font-black uppercase text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/10 transition-all cursor-pointer"><Activity className="w-3 h-3 text-brand-orange" />Cron</button>
            <button onClick={onRefresh} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-brown/5 border border-brand-brown/5 text-[9px] font-black uppercase text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/10 transition-all cursor-pointer"><RefreshCw className={`w-3 h-3 text-brand-orange ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all border border-rose-100 hover:border-rose-600 cursor-pointer"><LogOut className="w-3.5 h-3.5" />Logout</button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-brand-brown/10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-brand-brown/5 rounded-xl cursor-pointer"><Menu className="w-4 h-4 text-brand-brown" /></button>
            <span className="font-serif text-base font-black text-brand-brown">{mobileTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onBellClick} className="relative p-2 rounded-xl bg-brand-brown/5 cursor-pointer">
              <Bell className="w-4 h-4 text-brand-brown/60" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button onClick={onRefresh} className="p-2 bg-brand-brown/5 rounded-xl cursor-pointer"><RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${refreshing ? "animate-spin" : ""}`} /></button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-brand-brown/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-white text-brand-brown p-6 shadow-2xl z-50 border-r border-brand-brown/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2"><Image src="/WWY-LOGO_White.png" alt="WWY" width={28} height={28} className="object-contain" /><span className="font-serif font-black text-brand-brown leading-none">WWY Desk</span></div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-brand-brown/5 rounded-full cursor-pointer"><X className="w-4 h-4 text-brand-brown/60" /></button>
            </div>
            <nav className="flex flex-col gap-1.5 flex-grow">
              {OMS_NAV.map(({ key: t, icon: Icon, label }) => (
                <NavItem key={t} t={t} Icon={Icon} label={label} onClick={() => { onTabSelect?.(t); setMobileMenuOpen(false); }} />
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-brand-brown/10">
              <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-rose-50 text-rose-700 text-xs font-black uppercase rounded-2xl border border-rose-100 cursor-pointer"><LogOut className="w-3.5 h-3.5" />Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

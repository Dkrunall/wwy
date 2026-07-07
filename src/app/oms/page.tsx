"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag, Coffee, Users, Flame, Clock, CheckCircle, TrendingUp, RefreshCw,
  LogOut, ChevronDown, Phone, FileText, Clipboard, Check, Search, Activity, Menu, X,
  Loader2, BarChart2, Edit2, Trash2, Plus, XCircle, CalendarDays, MessageCircle,
  Download, Send, StickyNote, ChevronLeft, ChevronRight, Settings, Star, Bell, Zap,
} from "lucide-react";

interface OrderItem { id: string; product_name: string; quantity: number; unit_price_paise: number; }
interface Order {
  id: string; order_number: string | null; flat_number: string; customer_name: string;
  total_paise: number; status: string; payment_status: string | null;
  delivery_status: string | null; delivery_date: string | null; invoice_url: string | null;
  baker_id: string | null; notes: string | null; admin_notes: string | null;
  borzo_order_id: string | null; borzo_tracking_url: string | null;
  source: string | null; created_at: string; order_items?: OrderItem[];
}
interface Product { id: string; name: string; category: string; description?: string | null; price_paise: number; available: boolean; }
interface Customer { id: string; name: string; flat_number: string; phone: string | null; address?: string | null; pincode?: string | null; created_at: string; }
interface Baker { id: string; name: string; phone: string; is_active: boolean; share_token: string; pincodes?: string[]; daily_capacity?: number; address?: string | null; lat?: number | null; lng?: number | null; }
interface Setting { key: string; value: string; }
interface Feedback { id: string; order_id: string | null; flat_number: string; rating: number; comment: string | null; created_at: string; }
interface Session { phone: string; step: string; cart: unknown; temp: unknown; updated_at: string; }

type Tab = "orders" | "products" | "customers" | "bakers" | "analytics" | "feedback" | "settings";
type ModalType = "add-product" | "edit-product" | "add-baker" | "edit-baker" | "cancel-order" | "edit-delivery" | "edit-customer" | "delete-baker" | null;

function fmt(p: number) { return `₹${(p / 100).toFixed(0)}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
const ALL_STATUSES = ["placed","mixing","stretching","resting","cold_proof","baking","out_for_delivery","delivered"];
function getStepIndex(s: string | null) {
  return ALL_STATUSES.indexOf(s || "placed");
}

const D_LABELS: Record<string,string> = {
  placed:"Placed", mixing:"Mixing", stretching:"Stretch & Fold",
  resting:"Bulk Rest", cold_proof:"Cold Proof", baking:"Baking",
  out_for_delivery:"Out for Delivery", delivered:"Delivered", cancelled:"Cancelled",
};
const D_NEXT: Record<string,string> = {
  placed:"mixing", mixing:"stretching", stretching:"resting",
  resting:"cold_proof", cold_proof:"baking", baking:"out_for_delivery", out_for_delivery:"delivered",
};
const D_THEME: Record<string,{bg:string;text:string;border:string;pulse:string}> = {
  placed:           {bg:"bg-zinc-50",        text:"text-zinc-600",   border:"border-zinc-200/60",   pulse:"bg-zinc-400"},
  mixing:           {bg:"bg-yellow-50/60",   text:"text-yellow-800", border:"border-yellow-200/50", pulse:"bg-yellow-500"},
  stretching:       {bg:"bg-yellow-50/60",   text:"text-yellow-800", border:"border-yellow-200/50", pulse:"bg-yellow-500"},
  resting:          {bg:"bg-amber-50/50",    text:"text-amber-800",  border:"border-amber-200/50",  pulse:"bg-amber-500"},
  cold_proof:       {bg:"bg-sky-50/40",      text:"text-sky-700",    border:"border-sky-200/50",    pulse:"bg-sky-400"},
  baking:           {bg:"bg-orange-50/50",   text:"text-orange-800", border:"border-orange-200/50", pulse:"bg-orange-500"},
  out_for_delivery: {bg:"bg-sky-50/50",      text:"text-sky-800",    border:"border-sky-200/50",    pulse:"bg-sky-500"},
  delivered:        {bg:"bg-emerald-50/50",  text:"text-emerald-800",border:"border-emerald-200/50",pulse:"bg-emerald-500"},
  cancelled:        {bg:"bg-rose-50/50",     text:"text-rose-700",   border:"border-rose-200/50",   pulse:"bg-rose-400"},
};
const PAY_THEME: Record<string,{bg:string;text:string;border:string}> = {
  pending:{bg:"bg-amber-50/50",  text:"text-amber-700",  border:"border-amber-200/60"},
  paid:   {bg:"bg-emerald-50/50",text:"text-emerald-700",border:"border-emerald-200/60"},
  failed: {bg:"bg-rose-50/50",   text:"text-rose-700",   border:"border-rose-200/60"},
};

const ORDERS_PER_PAGE = 20;

export default function OmsDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSort, setOrderSort] = useState<"newest"|"oldest"|"amount"|"delivery">("newest");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationLoading, setVacationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedBakerId, setCopiedBakerId] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(1);

  // Category filter for products
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Customer sort
  const [customerSort, setCustomerSort] = useState<"date"|"spend"|"orders">("date");

  // Bulk assignment
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBakerId, setBulkBakerId] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Admin notes
  const [pendingNotes, setPendingNotes] = useState<Record<string,string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Action states
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBaker, setEditingBaker] = useState<Baker | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [productForm, setProductForm] = useState({name:"",category:"",description:"",price:"",available:true});
  const [bakerForm, setBakerForm] = useState({name:"",phone:"",pincodes:"",daily_capacity:"20",is_active:true,address:"",lat:"",lng:""});
  const [customerForm, setCustomerForm] = useState({name:"",phone:"",address:"",pincode:""});
  const [deliveryDateInput, setDeliveryDateInput] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Analytics date range
  const [analyticsFrom, setAnalyticsFrom] = useState("");
  const [analyticsTo, setAnalyticsTo] = useState("");

  // Settings / Feedback / Sessions
  const [settings, setSettings] = useState<Setting[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settingEdits, setSettingEdits] = useState<Record<string,string>>({});
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);
  const [deletingBakerId, setDeletingBakerId] = useState<string | null>(null);
  const [newOrdersAlert, setNewOrdersAlert] = useState(0);

  const [breadTime, setBreadTime] = useState("");
  useEffect(() => {
    const u = () => setBreadTime(new Date().toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}));
    u(); const id = setInterval(u, 1000); return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [oR, pR, cR, bR, vacR, sR, fR, sesR] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at",{ascending:false}),
      supabase.from("products").select("*").order("category"),
      supabase.from("customers").select("*").order("created_at",{ascending:false}),
      supabase.from("bakers").select("*").order("name"),
      fetch("/api/oms/vacation").then(r=>r.json()).catch(()=>({vacation_mode:false})),
      supabase.from("settings").select("*"),
      supabase.from("feedbacks").select("*").order("created_at",{ascending:false}).limit(100),
      supabase.from("sessions").select("*").order("updated_at",{ascending:false}).limit(50),
    ]);
    setOrders((oR.data||[]) as Order[]);
    setProducts(pR.data||[]);
    setCustomers(cR.data||[]);
    setBakers(bR.data||[]);
    setVacationMode(vacR.vacation_mode===true);
    setSettings((sR.data||[]) as Setting[]);
    setFeedbacks((fR.data||[]) as Feedback[]);
    setSessions((sesR.data||[]) as Session[]);
    setNewOrdersAlert(0);
    setLoading(false);
  }, []);
  useEffect(()=>{fetchData();},[fetchData]);

  // Poll for new orders every 30s
  useEffect(()=>{
    const iv = setInterval(async ()=>{
      const {count} = await supabase.from("orders").select("id",{count:"exact",head:true});
      if(count && count > orders.length) setNewOrdersAlert(count - orders.length);
    }, 30000);
    return ()=>clearInterval(iv);
  },[orders.length]);

  const toggleVacation = async () => {
    setVacationLoading(true);
    const nv = !vacationMode;
    await fetch("/api/oms/vacation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:nv})});
    setVacationMode(nv); setVacationLoading(false);
  };
  const advanceDelivery = async (orderId: string, cur: string) => {
    const next = D_NEXT[cur]; if(!next) return;
    setUpdatingId(orderId);
    await supabase.from("orders").update({delivery_status:next,updated_at:new Date().toISOString()}).eq("id",orderId);
    setOrders(p=>p.map(o=>o.id===orderId?{...o,delivery_status:next}:o));
    setUpdatingId(null);
  };
  const assignBaker = async (orderId: string, bakerId: string|null) => {
    await supabase.from("orders").update({baker_id:bakerId||null}).eq("id",orderId);
    setOrders(p=>p.map(o=>o.id===orderId?{...o,baker_id:bakerId}:o));
  };
  const toggleAvailability = async (pid: string, cur: boolean) => {
    await supabase.from("products").update({available:!cur}).eq("id",pid);
    setProducts(p=>p.map(x=>x.id===pid?{...x,available:!cur}:x));
  };
  const runCron = async () => {
    const r = await fetch("/api/oms/cron",{method:"POST"});
    const d = await r.json();
    alert(`Cron ran. ${d.processed||0} order(s) updated.`);
    fetchData();
  };
  const logout = async () => { await fetch("/api/oms/auth",{method:"DELETE"}); router.push("/oms/login"); };

  // ── Mark as Paid ──
  const markAsPaid = async (orderId: string) => {
    setMarkingPaidId(orderId);
    const r = await fetch("/api/oms/orders/mark-paid",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId})});
    const d = await r.json();
    if(d.ok) {
      setOrders(p=>p.map(o=>o.id===orderId?{...o,payment_status:"paid",status:"confirmed",invoice_url:d.invoiceUrl||o.invoice_url}:o));
    }
    setMarkingPaidId(null);
  };

  // ── Resend Invoice ──
  const resendInvoice = async (orderId: string) => {
    setResendingId(orderId);
    const r = await fetch("/api/oms/orders/resend-invoice",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId})});
    const d = await r.json();
    if(d.ok && d.invoiceUrl) {
      setOrders(p=>p.map(o=>o.id===orderId?{...o,invoice_url:d.invoiceUrl}:o));
    }
    setResendingId(null);
  };

  // ── Admin Notes ──
  const saveAdminNote = async (orderId: string) => {
    const note = pendingNotes[orderId];
    if(note === undefined) return;
    setSavingNoteId(orderId);
    await supabase.from("orders").update({admin_notes:note||null}).eq("id",orderId);
    setOrders(p=>p.map(o=>o.id===orderId?{...o,admin_notes:note||null}:o));
    setSavingNoteId(null);
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const rows = [["Order #","Date","Flat","Customer","Items","Total","Payment","Delivery","Delivery Date","Baker","Admin Notes"]];
    for(const o of filteredOrders) {
      const itemsStr = (o.order_items||[]).map(i=>`${i.quantity}x ${i.product_name}`).join("; ");
      const baker = bakers.find(b=>b.id===o.baker_id);
      rows.push([
        o.order_number||o.id.slice(0,8),
        new Date(o.created_at).toLocaleDateString("en-IN"),
        o.flat_number, o.customer_name, itemsStr,
        fmt(o.total_paise), o.payment_status||"", o.delivery_status||"",
        o.delivery_date||"", baker?.name||"", o.admin_notes||"",
      ]);
    }
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`wwy-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Bulk Assignment ──
  const bulkAssign = async () => {
    if(!bulkBakerId || selectedIds.size===0) return;
    setBulkAssigning(true);
    for(const id of selectedIds) {
      await supabase.from("orders").update({baker_id:bulkBakerId}).eq("id",id);
    }
    setOrders(p=>p.map(o=>selectedIds.has(o.id)?{...o,baker_id:bulkBakerId}:o));
    setSelectedIds(new Set()); setBulkBakerId(""); setBulkAssigning(false);
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  };

  // ── Product CRUD ──
  const openAddProduct = () => { setEditingProduct(null); setProductForm({name:"",category:"",description:"",price:"",available:true}); setFormError(""); setModal("add-product"); };
  const openEditProduct = (p: Product) => { setEditingProduct(p); setProductForm({name:p.name,category:p.category,description:p.description||"",price:(p.price_paise/100).toString(),available:p.available}); setFormError(""); setModal("edit-product"); };
  const saveProduct = async () => {
    const price_paise = Math.round(parseFloat(productForm.price)*100);
    if(!productForm.name.trim()){setFormError("Name required.");return;}
    if(!productForm.category.trim()){setFormError("Category required.");return;}
    if(isNaN(price_paise)||price_paise<=0){setFormError("Valid price required.");return;}
    setFormSaving(true);
    const payload = {name:productForm.name.trim(),category:productForm.category.trim(),description:productForm.description.trim()||null,price_paise,available:productForm.available};
    if(editingProduct) {
      const {error} = await supabase.from("products").update(payload).eq("id",editingProduct.id);
      if(error){setFormError("Save failed: "+error.message);setFormSaving(false);return;}
      setProducts(p=>p.map(x=>x.id===editingProduct.id?{...x,...payload}:x));
    } else {
      const {data,error} = await supabase.from("products").insert(payload).select().single();
      if(error){setFormError("Save failed: "+error.message);setFormSaving(false);return;}
      if(data) setProducts(p=>[...p,data]);
    }
    setFormSaving(false); setModal(null);
  };
  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id",id);
    setProducts(p=>p.filter(x=>x.id!==id)); setDeleteConfirmId(null);
  };

  // ── Baker CRUD ──
  const openAddBaker = () => { setEditingBaker(null); setBakerForm({name:"",phone:"",pincodes:"",daily_capacity:"20",is_active:true,address:"",lat:"",lng:""}); setFormError(""); setModal("add-baker"); };
  const openEditBaker = (b: Baker) => { setEditingBaker(b); setBakerForm({name:b.name,phone:b.phone,pincodes:(b.pincodes||[]).join(", "),daily_capacity:String(b.daily_capacity||20),is_active:b.is_active,address:b.address||"",lat:b.lat!=null?String(b.lat):"",lng:b.lng!=null?String(b.lng):""}); setFormError(""); setModal("edit-baker"); };
  const saveBaker = async () => {
    if(!bakerForm.name.trim()){setFormError("Name required.");return;}
    if(!bakerForm.phone.trim()){setFormError("Phone required.");return;}
    setFormSaving(true);
    const pincodes = bakerForm.pincodes.split(",").map(p=>p.trim()).filter(Boolean);
    const payload = {name:bakerForm.name.trim(),phone:bakerForm.phone.trim(),pincodes,daily_capacity:parseInt(bakerForm.daily_capacity)||20,is_active:bakerForm.is_active,address:bakerForm.address.trim()||null,lat:bakerForm.lat?parseFloat(bakerForm.lat):null,lng:bakerForm.lng?parseFloat(bakerForm.lng):null};
    if(editingBaker) {
      const {error} = await supabase.from("bakers").update(payload).eq("id",editingBaker.id);
      if(error){setFormError("Save failed: "+error.message);setFormSaving(false);return;}
      setBakers(p=>p.map(b=>b.id===editingBaker.id?{...b,...payload}:b));
    } else {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      const share_token = Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
      const {data,error} = await supabase.from("bakers").insert({...payload,share_token}).select().single();
      if(error){setFormError("Save failed: "+error.message);setFormSaving(false);return;}
      if(data) setBakers(p=>[...p,data]);
    }
    setFormSaving(false); setModal(null);
  };
  const toggleBakerActive = async (id: string, cur: boolean) => {
    await supabase.from("bakers").update({is_active:!cur}).eq("id",id);
    setBakers(p=>p.map(b=>b.id===id?{...b,is_active:!cur}:b));
  };

  // ── Customer Edit ──
  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({name:c.name,phone:c.phone||"",address:c.address||"",pincode:c.pincode||""});
    setFormError(""); setModal("edit-customer");
  };
  const saveCustomer = async () => {
    if(!customerForm.name.trim()){setFormError("Name required.");return;}
    setFormSaving(true);
    const payload = {name:customerForm.name.trim(),phone:customerForm.phone.trim()||null,address:customerForm.address.trim()||null,pincode:customerForm.pincode.trim()||null};
    const {error} = await supabase.from("customers").update(payload).eq("id",editingCustomer!.id);
    if(error){setFormError("Save failed: "+error.message);setFormSaving(false);return;}
    setCustomers(p=>p.map(c=>c.id===editingCustomer!.id?{...c,...payload}:c));
    setFormSaving(false); setModal(null);
  };

  // ── Order Actions ──
  const cancelOrder = async () => {
    if(!actionOrder) return;
    await supabase.from("orders").update({status:"cancelled",delivery_status:"cancelled"}).eq("id",actionOrder.id);
    setOrders(p=>p.map(o=>o.id===actionOrder.id?{...o,status:"cancelled",delivery_status:"cancelled"}:o));
    setModal(null); setActionOrder(null);
  };
  const saveDeliveryDate = async () => {
    if(!actionOrder||!deliveryDateInput) return;
    setFormSaving(true);
    await supabase.from("orders").update({delivery_date:deliveryDateInput}).eq("id",actionOrder.id);
    setOrders(p=>p.map(o=>o.id===actionOrder.id?{...o,delivery_date:deliveryDateInput}:o));
    setFormSaving(false); setModal(null); setActionOrder(null);
  };

  // ── Delete Baker ──
  const deleteBaker = async (id: string) => {
    await supabase.from("bakers").delete().eq("id",id);
    setBakers(p=>p.filter(b=>b.id!==id));
    setDeletingBakerId(null); setModal(null);
  };

  // ── Save Setting ──
  const saveSetting = async (key: string) => {
    const val = settingEdits[key];
    if(val === undefined) return;
    setSavingSettingKey(key);
    await supabase.from("settings").upsert({key,value:val},{onConflict:"key"});
    setSettings(p=>{
      const exists = p.find(s=>s.key===key);
      return exists ? p.map(s=>s.key===key?{...s,value:val}:s) : [...p,{key,value:val}];
    });
    setSavingSettingKey(null);
  };

  // ── Analytics ──
  const analytics = useMemo(()=>{
    let baseOrders = orders.filter(o=>o.payment_status==="paid");
    if(analyticsFrom) baseOrders = baseOrders.filter(o=>new Date(o.created_at)>=new Date(analyticsFrom));
    if(analyticsTo)   baseOrders = baseOrders.filter(o=>new Date(o.created_at)<=new Date(analyticsTo+"T23:59:59"));
    const totalRevenue = baseOrders.reduce((s,o)=>s+o.total_paise,0);
    const avgOrderValue = baseOrders.length>0?Math.round(totalRevenue/baseOrders.length):0;
    const last7 = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
    const revenueByDay = last7.map(d=>({
      label:d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"}),
      revenue:baseOrders.filter(o=>new Date(o.created_at).toDateString()===d.toDateString()).reduce((s,o)=>s+o.total_paise,0),
    }));
    const maxDayRevenue = Math.max(...revenueByDay.map(d=>d.revenue),1);
    const productMap = new Map<string,{name:string;qty:number;revenue:number}>();
    baseOrders.forEach(o=>o.order_items?.forEach(item=>{
      const e=productMap.get(item.product_name)||{name:item.product_name,qty:0,revenue:0};
      productMap.set(item.product_name,{name:item.product_name,qty:e.qty+item.quantity,revenue:e.revenue+item.quantity*item.unit_price_paise});
    }));
    const topProducts = Array.from(productMap.values()).sort((a,b)=>b.qty-a.qty).slice(0,5);
    const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000);
    const newCustomers = customers.filter(c=>new Date(c.created_at)>thirtyDaysAgo).length;
    const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate()-thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate()-7);
    const thisWeekRevenue = baseOrders.filter(o=>new Date(o.created_at)>=thisWeekStart).reduce((s,o)=>s+o.total_paise,0);
    const lastWeekRevenue = baseOrders.filter(o=>{const d=new Date(o.created_at);return d>=lastWeekStart&&d<thisWeekStart;}).reduce((s,o)=>s+o.total_paise,0);
    return {totalRevenue,avgOrderValue,revenueByDay,maxDayRevenue,topProducts,newCustomers,thisWeekRevenue,lastWeekRevenue};
  },[orders,customers,analyticsFrom,analyticsTo]);

  const todayDeliveries = useMemo(()=>{
    const today = new Date().toISOString().slice(0,10);
    return orders.filter(o=>o.delivery_date===today&&o.payment_status==="paid"&&o.delivery_status!=="delivered"&&o.status!=="cancelled");
  },[orders]);

  const bakerHolidays = useMemo(()=>{
    const map: Record<string,boolean> = {};
    for (const s of settings) {
      if (s.key.startsWith("baker_holiday_") && s.value === "true")
        map[s.key.replace("baker_holiday_","")] = true;
    }
    return map;
  },[settings]);

  const bakerStats = useMemo(()=>{
    const map: Record<string,{active:number;delivered:number;revenue:number}> = {};
    for(const b of bakers) {
      const bOrds = orders.filter(o=>o.baker_id===b.id);
      map[b.id] = {
        active:bOrds.filter(o=>o.payment_status==="paid"&&o.delivery_status!=="delivered"&&o.status!=="cancelled").length,
        delivered:bOrds.filter(o=>o.delivery_status==="delivered").length,
        revenue:bOrds.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+o.total_paise,0),
      };
    }
    return map;
  },[bakers,orders]);

  const settingValues = useMemo(()=>{
    const m: Record<string,string> = {};
    for(const s of settings) m[s.key] = s.value;
    return m;
  },[settings]);

  // ── Filters & Sorts ──
  const existingCategories = [...new Set(products.map(p=>p.category))];
  const pending = orders.filter(o=>o.payment_status==="pending").length;
  const confirmed = orders.filter(o=>o.payment_status==="paid").length;
  const todayRevenue = orders.filter(o=>new Date(o.created_at).toDateString()===new Date().toDateString()&&o.payment_status==="paid").reduce((s,o)=>s+o.total_paise,0);

  const sortedOrders = useMemo(()=>[...orders].sort((a,b)=>{
    if(orderSort==="oldest") return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
    if(orderSort==="amount") return b.total_paise-a.total_paise;
    if(orderSort==="delivery") return (a.delivery_date||"").localeCompare(b.delivery_date||"");
    return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
  }),[orders,orderSort]);

  const filteredOrders = useMemo(()=>sortedOrders.filter(o=>{
    if(statusFilter==="today") return new Date(o.created_at).toDateString()===new Date().toDateString();
    if(statusFilter==="paid") return o.payment_status==="paid";
    if(statusFilter==="pending") return o.payment_status==="pending";
    if(statusFilter==="cancelled") return o.status==="cancelled";
    return true;
  }).filter(o=>{
    if(!searchQuery) return true;
    const q=searchQuery.toLowerCase();
    return (o.order_number||"").toLowerCase().includes(q)||(o.customer_name||"").toLowerCase().includes(q)||(o.flat_number||"").toLowerCase().includes(q)||(o.notes||"").toLowerCase().includes(q)||o.order_items?.some(i=>i.product_name.toLowerCase().includes(q));
  }),[sortedOrders,statusFilter,searchQuery]);

  const pagedOrders = filteredOrders.slice((orderPage-1)*ORDERS_PER_PAGE, orderPage*ORDERS_PER_PAGE);
  const totalPages = Math.max(1,Math.ceil(filteredOrders.length/ORDERS_PER_PAGE));

  const filteredProducts = products.filter(p=>{
    if(categoryFilter!=="all"&&p.category!==categoryFilter) return false;
    if(!searchQuery) return true;
    const q=searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q);
  });

  const sortedCustomers = useMemo(()=>[...customers].filter(c=>{
    if(!searchQuery) return true;
    const q=searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q)||(c.flat_number||"").toLowerCase().includes(q)||(c.phone||"").toLowerCase().includes(q);
  }).sort((a,b)=>{
    if(customerSort==="spend"){
      const spA=orders.filter(o=>o.flat_number===a.flat_number&&o.payment_status==="paid").reduce((s,o)=>s+o.total_paise,0);
      const spB=orders.filter(o=>o.flat_number===b.flat_number&&o.payment_status==="paid").reduce((s,o)=>s+o.total_paise,0);
      return spB-spA;
    }
    if(customerSort==="orders"){
      const cA=orders.filter(o=>o.flat_number===a.flat_number).length;
      const cB=orders.filter(o=>o.flat_number===b.flat_number).length;
      return cB-cA;
    }
    return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
  }),[customers,orders,searchQuery,customerSort]);

  const closeModal = () => { setModal(null); setEditingProduct(null); setEditingBaker(null); setEditingCustomer(null); setActionOrder(null); setDeletingBakerId(null); setFormError(""); };

  const NAV: {key:Tab;icon:React.ElementType;label:string}[] = [
    {key:"orders",icon:ShoppingBag,label:"Orders"},
    {key:"products",icon:Coffee,label:"Products"},
    {key:"customers",icon:Users,label:"Customers"},
    {key:"bakers",icon:Flame,label:"Bakers"},
    {key:"analytics",icon:BarChart2,label:"Analytics"},
    {key:"feedback",icon:Star,label:"Feedback"},
    {key:"settings",icon:Settings,label:"Settings"},
  ];

  const inputCls = "w-full bg-brand-oat/40 border border-brand-brown/15 rounded-2xl px-4 py-3 font-bold text-brand-brown text-sm outline-none focus:border-brand-orange transition-colors";

  return (
    <div className="min-h-screen bg-brand-oat text-brand-brown font-sans flex flex-col md:flex-row antialiased">

      {/* ── MODALS ── */}
      {(modal || deleteConfirmId || deletingBakerId) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-brand-brown/50 backdrop-blur-sm" />

          {/* Product Modal */}
          {(modal==="add-product"||modal==="edit-product") && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-black text-brand-brown">{modal==="add-product"?"Add Product":"Edit Product"}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-brand-brown/5 rounded-full"><X className="w-4 h-4 text-brand-brown/50"/></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Name</label><input className={inputCls} placeholder="Sourdough Loaf" autoFocus value={productForm.name} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Category</label><input className={inputCls} list="cat-list" placeholder="Bread" value={productForm.category} onChange={e=>setProductForm(f=>({...f,category:e.target.value}))}/><datalist id="cat-list">{existingCategories.map(c=><option key={c} value={c}/>)}</datalist></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Description <span className="normal-case font-bold text-brand-brown/30">(optional)</span></label><textarea className={inputCls+" resize-none"} rows={2} placeholder="e.g. Naturally leavened, 700g" value={productForm.description} onChange={e=>setProductForm(f=>({...f,description:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Price (₹)</label><input className={inputCls} type="number" min="0" placeholder="450" value={productForm.price} onChange={e=>setProductForm(f=>({...f,price:e.target.value}))}/></div>
                <div className="flex items-center justify-between bg-brand-oat/40 border border-brand-brown/10 rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-brand-brown/70">Available on storefront</span>
                  <button onClick={()=>setProductForm(f=>({...f,available:!f.available}))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${productForm.available?"bg-brand-orange":"bg-brand-brown/20"}`}><span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${productForm.available?"translate-x-4.5":"translate-x-0.5"}`}/></button>
                </div>
              </div>
              {formError && <p className="text-xs font-bold text-rose-600 -mt-2">{formError}</p>}
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Cancel</button><button onClick={saveProduct} disabled={formSaving} className="flex-1 py-3 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">{formSaving&&<Loader2 className="w-3.5 h-3.5 animate-spin"/>}{modal==="add-product"?"Add Product":"Save Changes"}</button></div>
            </div>
          )}

          {/* Baker Modal */}
          {(modal==="add-baker"||modal==="edit-baker") && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-black text-brand-brown">{modal==="add-baker"?"Add Baker":"Edit Baker"}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-brand-brown/5 rounded-full"><X className="w-4 h-4 text-brand-brown/50"/></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Name</label><input className={inputCls} autoFocus placeholder="Priya Mehta" value={bakerForm.name} onChange={e=>setBakerForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Phone</label><input className={inputCls} type="tel" placeholder="9876543210" value={bakerForm.phone} onChange={e=>setBakerForm(f=>({...f,phone:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Pincodes <span className="normal-case font-bold text-brand-brown/30">(comma-separated)</span></label><input className={inputCls} placeholder="400001, 400002" value={bakerForm.pincodes} onChange={e=>setBakerForm(f=>({...f,pincodes:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Daily Capacity</label><input className={inputCls} type="number" min="1" placeholder="20" value={bakerForm.daily_capacity} onChange={e=>setBakerForm(f=>({...f,daily_capacity:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Pickup Address <span className="normal-case font-bold text-brand-brown/30">(for Borzo dispatch)</span></label>
                  <textarea className={inputCls+" resize-none text-sm"} rows={2} placeholder="Full kitchen address incl. street, area, city, pincode" value={bakerForm.address} onChange={e=>setBakerForm(f=>({...f,address:e.target.value}))}/>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Latitude</label><input className={inputCls} type="number" step="any" placeholder="19.0760" value={bakerForm.lat} onChange={e=>setBakerForm(f=>({...f,lat:e.target.value}))}/></div>
                  <div className="flex flex-col gap-1.5 flex-1"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Longitude</label><input className={inputCls} type="number" step="any" placeholder="72.8777" value={bakerForm.lng} onChange={e=>setBakerForm(f=>({...f,lng:e.target.value}))}/></div>
                </div>
                <div className="flex items-center justify-between bg-brand-oat/40 border border-brand-brown/10 rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-brand-brown/70">Active (accepts orders)</span>
                  <button onClick={()=>setBakerForm(f=>({...f,is_active:!f.is_active}))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${bakerForm.is_active?"bg-brand-orange":"bg-brand-brown/20"}`}><span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${bakerForm.is_active?"translate-x-4.5":"translate-x-0.5"}`}/></button>
                </div>
              </div>
              {formError && <p className="text-xs font-bold text-rose-600 -mt-2">{formError}</p>}
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Cancel</button><button onClick={saveBaker} disabled={formSaving} className="flex-1 py-3 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">{formSaving&&<Loader2 className="w-3.5 h-3.5 animate-spin"/>}{modal==="add-baker"?"Add Baker":"Save Changes"}</button></div>
            </div>
          )}

          {/* Customer Edit Modal */}
          {modal==="edit-customer" && editingCustomer && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-black text-brand-brown">Edit Customer</h2>
                <button onClick={closeModal} className="p-2 hover:bg-brand-brown/5 rounded-full"><X className="w-4 h-4 text-brand-brown/50"/></button>
              </div>
              <p className="text-xs font-bold text-brand-brown/40 -mt-3">Flat {editingCustomer.flat_number}</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Name</label><input className={inputCls} autoFocus value={customerForm.name} onChange={e=>setCustomerForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Phone / WhatsApp</label><input className={inputCls} type="tel" placeholder="9876543210" value={customerForm.phone} onChange={e=>setCustomerForm(f=>({...f,phone:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Address</label><input className={inputCls} placeholder="Tower B, Apt 12..." value={customerForm.address} onChange={e=>setCustomerForm(f=>({...f,address:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Pincode</label><input className={inputCls} placeholder="400001" value={customerForm.pincode} onChange={e=>setCustomerForm(f=>({...f,pincode:e.target.value}))}/></div>
              </div>
              {formError && <p className="text-xs font-bold text-rose-600 -mt-2">{formError}</p>}
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Cancel</button><button onClick={saveCustomer} disabled={formSaving} className="flex-1 py-3 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">{formSaving&&<Loader2 className="w-3.5 h-3.5 animate-spin"/>}Save Changes</button></div>
            </div>
          )}

          {/* Cancel Order */}
          {modal==="cancel-order" && actionOrder && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e=>e.stopPropagation()}>
              <h2 className="font-serif text-xl font-black text-rose-700">Cancel Order?</h2>
              <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-4">
                <p className="text-sm font-black text-rose-800">{actionOrder.order_number||`#${actionOrder.id.slice(0,8).toUpperCase()}`}</p>
                <p className="text-xs font-bold text-rose-700/70 mt-1">{actionOrder.customer_name} · Flat {actionOrder.flat_number} · {fmt(actionOrder.total_paise)}</p>
                {actionOrder.payment_status==="paid" && <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-100 rounded-xl px-3 py-2">⚠ Order is paid — arrange a manual refund if needed.</p>}
              </div>
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Keep</button><button onClick={cancelOrder} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider">Yes, Cancel</button></div>
            </div>
          )}

          {/* Edit Delivery Date */}
          {modal==="edit-delivery" && actionOrder && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e=>e.stopPropagation()}>
              <h2 className="font-serif text-xl font-black text-brand-brown">Edit Delivery Date</h2>
              <p className="text-xs font-bold text-brand-brown/50 -mt-2">{actionOrder.order_number} · {actionOrder.customer_name}</p>
              <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">New Date</label><input className={inputCls} type="date" value={deliveryDateInput} onChange={e=>setDeliveryDateInput(e.target.value)}/></div>
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Cancel</button><button onClick={saveDeliveryDate} disabled={formSaving||!deliveryDateInput} className="flex-1 py-3 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">{formSaving&&<Loader2 className="w-3.5 h-3.5 animate-spin"/>}Update</button></div>
            </div>
          )}

          {/* Delete Product Confirm */}
          {deleteConfirmId && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e=>e.stopPropagation()}>
              <h2 className="font-serif text-xl font-black text-rose-700">Delete Product?</h2>
              <p className="text-sm font-bold text-brand-brown/60">This cannot be undone.</p>
              <div className="flex gap-3"><button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Keep</button><button onClick={()=>deleteProduct(deleteConfirmId)} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider">Delete</button></div>
            </div>
          )}

          {/* Delete Baker Confirm */}
          {modal==="delete-baker" && deletingBakerId && (
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e=>e.stopPropagation()}>
              <h2 className="font-serif text-xl font-black text-rose-700">Delete Baker?</h2>
              <p className="text-sm font-bold text-brand-brown/60">This will permanently remove <span className="text-brand-brown">{bakers.find(b=>b.id===deletingBakerId)?.name}</span>. Existing orders with this baker will become unassigned.</p>
              <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 rounded-2xl border border-brand-brown/15 text-xs font-black uppercase tracking-wider text-brand-brown/60 hover:bg-brand-brown/5">Cancel</button><button onClick={()=>deleteBaker(deletingBakerId)} className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider">Delete Baker</button></div>
            </div>
          )}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-72 bg-white text-brand-brown border-r border-brand-brown/10 fixed inset-y-0 left-0 p-6 z-30 shadow-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-brand-brown/5 p-2 rounded-2xl"><Image src="/logo.png" alt="WWY" width={34} height={34} className="object-contain"/></div>
          <div><h1 className="font-serif text-lg font-black text-brand-brown leading-tight">Wild Wild Yeast</h1><span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-orange">Order Desk</span></div>
        </div>
        <nav className="flex flex-col gap-1.5 flex-grow">
          {NAV.map(({key:t,icon:Icon,label})=>{
            const active=tab===t;
            return <button key={t} onClick={()=>{setTab(t);setSearchQuery("");}} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${active?"bg-brand-brown text-white shadow-md shadow-brand-brown/10 scale-[1.02]":"text-brand-brown/65 hover:text-brand-brown hover:bg-brand-brown/5"}`}><Icon className={`w-4 h-4 ${active?"text-brand-orange animate-pulse":"text-brand-brown/30"}`}/>{label}</button>;
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-brand-brown/10 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-brand-brown/5 rounded-2xl px-4 py-2.5 border border-brand-brown/5">
            <div><span className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40 block">Oven Status</span><span className="text-[10px] font-bold text-brand-brown">{vacationMode?"🌾 On Break":"Active"}</span></div>
            <button onClick={toggleVacation} disabled={vacationLoading} className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors ${vacationMode?"bg-brand-orange":"bg-brand-brown/20"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${vacationMode?"translate-x-5":"translate-x-1"}`}/></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={runCron} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-brown/5 border border-brand-brown/5 text-[9px] font-black uppercase text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/10 transition-all cursor-pointer"><Activity className="w-3 h-3 text-brand-orange"/>Cron</button>
            <button onClick={fetchData} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-brown/5 border border-brand-brown/5 text-[9px] font-black uppercase text-brand-brown/70 hover:text-brand-brown hover:bg-brand-brown/10 transition-all cursor-pointer"><RefreshCw className={`w-3 h-3 text-brand-orange ${loading?"animate-spin":""}`}/>Refresh</button>
          </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all border border-rose-100 hover:border-rose-600 cursor-pointer"><LogOut className="w-3.5 h-3.5"/>Logout</button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-brand-brown/10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={()=>setMobileMenuOpen(true)} className="p-2 bg-brand-brown/5 rounded-xl"><Menu className="w-4 h-4 text-brand-brown"/></button>
            <span className="font-serif text-base font-black text-brand-brown">WWY Desk</span>
          </div>
          <button onClick={fetchData} className="p-2 bg-brand-brown/5 rounded-xl"><RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${loading?"animate-spin":""}`}/></button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-brand-brown/40 backdrop-blur-sm" onClick={()=>setMobileMenuOpen(false)}/>
          <div className="relative flex flex-col w-4/5 max-w-xs bg-white text-brand-brown p-6 shadow-2xl z-50 border-r border-brand-brown/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2"><Image src="/logo.png" alt="WWY" width={28} height={28} className="object-contain"/><span className="font-serif font-black text-brand-brown leading-none">WWY Desk</span></div>
              <button onClick={()=>setMobileMenuOpen(false)} className="p-2 bg-brand-brown/5 rounded-full"><X className="w-4 h-4 text-brand-brown/60"/></button>
            </div>
            <nav className="flex flex-col gap-1.5 flex-grow">
              {NAV.map(({key:t,icon:Icon,label})=>{
                const active=tab===t;
                return <button key={t} onClick={()=>{setTab(t);setSearchQuery("");setMobileMenuOpen(false);}} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${active?"bg-brand-brown text-white shadow-md":"text-brand-brown/65 hover:text-brand-brown hover:bg-brand-brown/5"}`}><Icon className={`w-4 h-4 ${active?"text-brand-orange animate-pulse":"text-brand-brown/30"}`}/>{label}</button>;
              })}
            </nav>
            <div className="mt-auto pt-4 border-t border-brand-brown/10">
              <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-3 bg-rose-50 text-rose-700 text-xs font-black uppercase rounded-2xl border border-rose-100 cursor-pointer"><LogOut className="w-3.5 h-3.5"/>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 md:pl-72 py-6 px-4 sm:px-8 max-w-6xl mx-auto w-full relative">
        {/* Background elegant dot overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2 relative z-10">
          <div><h1 className="font-serif text-3xl font-black text-brand-brown tracking-tight">Artisan Dashboard</h1><p className="text-[10px] font-black text-brand-brown/40 uppercase tracking-widest mt-1">Wild Wild Yeast · Live Ops</p></div>
          <div className="flex items-center gap-2.5 bg-brand-brown/5 border border-brand-brown/5 px-4 py-2.5 rounded-2xl shrink-0 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-ping"/>
            <div className="flex flex-col text-right"><span className="text-[8px] font-black uppercase text-brand-orange tracking-widest">BREAD TIME</span><span className="text-xs font-black font-mono text-brand-brown">{breadTime}</span></div>
          </div>
        </div>

        {vacationMode && <div className="mb-6 bg-brand-orange/10 border-2 border-brand-orange/20 rounded-3xl px-5 py-4 text-xs font-black text-brand-brown flex items-center gap-3 animate-pulse"><span className="text-xl">🌾</span><div><p className="font-serif font-black uppercase tracking-wider">Vacation mode is active</p><p className="text-brand-brown/70 font-bold mt-0.5">Storefront orders are paused.</p></div></div>}

        {/* New orders alert */}
        {newOrdersAlert > 0 && (
          <div className="mb-4 bg-emerald-50 border-2 border-emerald-200 rounded-3xl px-5 py-3 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5"><Bell className="w-4 h-4 text-emerald-600"/><p className="text-sm font-black text-emerald-800">{newOrdersAlert} new order{newOrdersAlert>1?"s":""} arrived</p></div>
            <button onClick={()=>fetchData()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-3 h-3"/>Refresh</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 relative z-10">
          {[
            {label:"Pending Payment",value:pending,unit:"orders",icon:Clock,color:"text-amber-700",bg:"bg-amber-50/70 border-amber-200/50",bar:"bg-amber-500",pct:orders.length>0?pending/orders.length:0},
            {label:"Paid & Confirmed",value:confirmed,unit:"ready",icon:CheckCircle,color:"text-emerald-700",bg:"bg-emerald-50/70 border-emerald-200/50",bar:"bg-emerald-500",pct:orders.length>0?confirmed/orders.length:0},
            {label:"Today Revenue",value:fmt(todayRevenue),unit:"paid",icon:TrendingUp,color:"text-brand-brown",bg:"bg-brand-orange/10 border-brand-orange/15",bar:"bg-brand-orange",pct:1},
            {label:"Customers",value:customers.length,unit:"total",icon:Users,color:"text-brand-brown",bg:"bg-brand-brown/5 border-brand-brown/10",bar:"bg-brand-brown/40",pct:1},
          ].map(({label,value,unit,icon:Icon,color,bg,bar,pct})=>(
            <div key={label} className="relative overflow-hidden bg-white rounded-[2rem] p-5 border border-brand-brown/10 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 leading-none">{label}</span>
                  <div className={`p-1.5 rounded-xl ${bg} border`}>
                    <Icon className="w-3.5 h-3.5 text-brand-brown/60"/>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-serif text-3xl font-black text-brand-brown tracking-tight">{value}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${bg}`}>{unit}</span>
                <div className="w-full bg-brand-brown/5 h-1 rounded-full mt-2.5 overflow-hidden">
                  <div className={`${bar} h-full rounded-full transition-all duration-500`} style={{width:`${Math.min(pct*100,100)}%`}}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden gap-1.5 mb-6 bg-brand-brown/5 rounded-2xl p-1 overflow-x-auto">
          {NAV.map(({key:t,label})=>(
            <button key={t} onClick={()=>{setTab(t);setSearchQuery("");}} className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase whitespace-nowrap cursor-pointer transition-all ${tab===t?"bg-brand-brown text-white shadow-sm":"text-brand-brown/50 hover:text-brand-brown"}`}>{label}</button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-5 relative z-10">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/30"/>
            <input type="text" placeholder={`Search ${tab}…`} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-11 pr-12 py-3 bg-white border border-brand-brown/10 rounded-2xl font-bold text-xs text-brand-brown placeholder:text-brand-brown/35 outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 transition-all shadow-sm"/>
            {searchQuery && <button onClick={()=>setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-brand-brown/40 bg-brand-brown/5 px-2 py-0.5 rounded-lg hover:bg-brand-brown/10 transition-colors">Clear</button>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {tab==="orders" && <>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-brand-brown/10 text-[10px] font-black uppercase tracking-widest text-brand-brown/60 hover:text-brand-brown hover:border-brand-brown/25 shadow-sm transition-all duration-200 cursor-pointer"><Download className="w-3.5 h-3.5"/>Export CSV</button>
            </>}
            {tab==="products" && <button onClick={openAddProduct} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add Product</button>}
            {tab==="bakers"   && <button onClick={openAddBaker}   className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add Baker</button>}
          </div>
        </div>

        {/* Orders filters + sort */}
        {tab==="orders" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5 relative z-10">
            <div className="flex gap-1.5 overflow-x-auto flex-wrap">
              {["all","today","paid","pending","cancelled"].map(s=>(
                <button key={s} onClick={()=>{setStatusFilter(s);setOrderPage(1);}} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap ${statusFilter===s?"bg-brand-brown text-white border-brand-brown shadow-sm":"bg-white text-brand-brown/60 border-brand-brown/10 hover:border-brand-brown/25 hover:text-brand-brown"}`}>
                  {s==="all"?`All (${orders.length})`:s}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 ml-auto overflow-x-auto">
              {(["newest","oldest","amount","delivery"] as const).map(s=>(
                <button key={s} onClick={()=>{setOrderSort(s);setOrderPage(1);}} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap ${orderSort===s?"bg-brand-orange/15 text-brand-orange border-brand-orange/30":"bg-white text-brand-brown/50 border-brand-brown/10 hover:border-brand-brown/25"}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Bulk assignment bar */}
        {tab==="orders" && selectedIds.size>0 && (
          <div className="flex items-center gap-3 mb-4 bg-brand-brown text-white rounded-2xl px-4 py-3 relative z-10 shadow-md">
            <span className="text-xs font-black">{selectedIds.size} selected</span>
            <div className="relative flex-1 max-w-[200px]">
              <select value={bulkBakerId} onChange={e=>setBulkBakerId(e.target.value)} className="w-full appearance-none text-xs font-bold bg-white/10 border border-white/20 rounded-xl pl-3 pr-7 py-1.5 text-white outline-none focus:border-white/50 cursor-pointer">
                <option value="">— Pick baker —</option>
                {bakers.filter(b=>b.is_active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none"/>
            </div>
            <button onClick={bulkAssign} disabled={!bulkBakerId||bulkAssigning} className="px-4 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-gold text-brand-brown text-xs font-black uppercase disabled:opacity-50 flex items-center gap-1.5 transition-all">
              {bulkAssigning?<Loader2 className="w-3 h-3 animate-spin"/>:null}Assign
            </button>
            <button onClick={()=>{setSelectedIds(new Set());setBulkBakerId("");}} className="ml-auto p-1.5 hover:bg-white/10 rounded-full"><X className="w-3.5 h-3.5 text-white/60"/></button>
          </div>
        )}

        {/* Products category filter */}
        {tab==="products" && existingCategories.length>0 && (
          <div className="flex gap-1.5 mb-5 overflow-x-auto relative z-10">
            {["all",...existingCategories].map(c=>(
              <button key={c} onClick={()=>setCategoryFilter(c)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap ${categoryFilter===c?"bg-brand-brown text-white border-brand-brown shadow-sm":"bg-white text-brand-brown/60 border-brand-brown/10 hover:border-brand-brown/25"}`}>{c==="all"?"All Categories":c}</button>
            ))}
          </div>
        )}

        {/* Customer sort */}
        {tab==="customers" && (
          <div className="flex gap-1.5 mb-5 relative z-10">
            {(["date","spend","orders"] as const).map(s=>(
              <button key={s} onClick={()=>setCustomerSort(s)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${customerSort===s?"bg-brand-brown text-white border-brand-brown shadow-sm":"bg-white text-brand-brown/60 border-brand-brown/10 hover:border-brand-brown/25"}`}>
                {s==="date"?"Most Recent":s==="spend"?"Most Spent":"Most Orders"}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 relative z-10">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin"/>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40 animate-pulse">Syncing…</p>
          </div>
        )}

        {/* ── ORDERS ── */}
        {!loading && tab==="orders" && (
          <div className="flex flex-col gap-4 relative z-10">

            {/* Today's deliveries banner */}
            {todayDeliveries.length > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-[2rem] p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-sky-600"/><span className="text-[10px] font-black uppercase tracking-widest text-sky-700">Today&apos;s Deliveries — {todayDeliveries.length} order{todayDeliveries.length!==1?"s":""}</span></div>
                <div className="flex flex-col gap-2">
                  {todayDeliveries.map(o=>{
                    const baker = bakers.find(b=>b.id===o.baker_id);
                    const del = D_THEME[o.delivery_status||"placed"];
                    return (
                      <div key={o.id} className="flex items-center justify-between bg-white border border-sky-100 rounded-2xl px-4 py-2.5 gap-3">
                        <div className="min-w-0"><p className="text-xs font-black text-brand-brown truncate">{o.customer_name} — Flat {o.flat_number}</p><p className="text-[10px] font-bold text-brand-brown/50">{baker?baker.name:"Unassigned baker"} · {fmt(o.total_paise)}</p></div>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border ${del.bg} ${del.text} ${del.border} shrink-0`}>{D_LABELS[o.delivery_status||"placed"]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pagedOrders.length===0 && <div className="text-center py-16 bg-white border border-brand-brown/10 rounded-[2rem] shadow-sm"><span className="text-3xl block mb-2">🍞</span><p className="text-sm font-bold text-brand-brown/40">No orders match.</p></div>}
            {pagedOrders.map(order=>{
              const isExpanded = expandedOrderId===order.id;
              const payTheme = PAY_THEME[order.payment_status||"pending"]||PAY_THEME.pending;
              const delStatus = order.delivery_status||"placed";
              const delTheme = D_THEME[delStatus]||D_THEME.placed;
              const delNext = D_NEXT[delStatus];
              const assignedBaker = bakers.find(b=>b.id===order.baker_id);
              const isCancelled = order.status==="cancelled";
              const customerPhone = customers.find(c=>c.flat_number===order.flat_number)?.phone;
              const noteVal = pendingNotes[order.id]??order.admin_notes??"";
              const isSelected = selectedIds.has(order.id);

              return (
                <div key={order.id} className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.002] transition-all duration-300 ${isSelected?"border-brand-orange ring-2 ring-brand-orange/20":"border-brand-brown/10"}`}>
                  <div onClick={()=>setExpandedOrderId(isExpanded?null:order.id)} className="w-full px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-brand-oat/10 transition-colors">
                    <div className="flex-grow flex flex-col gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Checkbox */}
                        <div onClick={e=>{e.stopPropagation();toggleSelect(order.id);}} className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all ${isSelected?"bg-brand-brown border-brand-brown":"border-brand-brown/20 hover:border-brand-brown"}`}>
                          {isSelected&&<Check className="w-3 h-3 text-white"/>}
                        </div>
                        <span className="font-serif text-lg font-black text-brand-brown">Flat {order.flat_number}</span>
                        <span className="text-brand-brown/20">·</span>
                        <span className="text-xs font-bold text-brand-brown/70">{order.customer_name}</span>
                        <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-xl border ${payTheme.bg} ${payTheme.text} ${payTheme.border}`}>{order.payment_status||"pending"}</span>
                        {isCancelled?(
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border bg-rose-50/50 text-rose-700 border-rose-200/50"><XCircle className="w-3 h-3"/>Cancelled</span>
                        ):order.payment_status==="paid"&&(
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border ${delTheme.bg} ${delTheme.text} ${delTheme.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${delTheme.pulse} ${delStatus!=="delivered"?"animate-ping":""}`}/>
                            {D_LABELS[delStatus]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-brand-brown/40 font-bold">
                        <span>{fmtDate(order.created_at)}</span><span>·</span>
                        <span className="font-mono bg-brand-brown/5 px-2 py-0.5 rounded text-[10px] text-brand-brown/65">{order.order_number||`#${order.id.slice(0,8).toUpperCase()}`}</span>
                        <span>·</span><span className="font-serif font-black text-brand-brown/75 text-xs">{fmt(order.total_paise)}</span>
                        {order.source==="whatsapp"&&<span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg"><MessageCircle className="w-2.5 h-2.5"/>WA</span>}
                        {order.delivery_date&&<><span>·</span><span className="text-brand-orange">Delivery: {order.delivery_date}</span></>}
                      </div>
                      {!isCancelled&&order.payment_status==="paid"&&(
                        <div className="mt-2 pt-3 border-t border-brand-brown/5 flex items-center justify-between gap-1 text-[8px] font-black text-brand-brown/40 overflow-x-auto pb-1">
                          {[{key:"placed",label:"1. Placed"},{key:"resting",label:"2. Resting"},{key:"baking",label:"3. Baking"},{key:"out_for_delivery",label:"4. Transit"},{key:"delivered",label:"5. Done"}].map((step,idx,arr)=>{
                            const done=getStepIndex(order.delivery_status)>=idx;
                            const active=order.delivery_status===step.key;
                            return <React.Fragment key={step.key}>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border transition-all ${active?"bg-brand-orange border-brand-orange text-white ring-4 ring-brand-orange/15 scale-110":done?"bg-brand-brown border-brand-brown text-white":"bg-white border-brand-brown/15 text-brand-brown/30"}`}>{done&&!active?"✓":idx+1}</span>
                                <span className={`uppercase tracking-widest ${active?"text-brand-orange":done?"text-brand-brown":"text-brand-brown/30"}`}>{step.label}</span>
                              </div>
                              {idx<arr.length-1&&<div className={`flex-grow h-0.5 min-w-2 max-w-8 rounded ${getStepIndex(order.delivery_status)>idx?"bg-brand-brown/40":"bg-brand-brown/10"}`}/>}
                            </React.Fragment>;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={e=>e.stopPropagation()}>
                      {!isCancelled&&order.payment_status==="paid"&&delNext&&(
                        <button onClick={()=>advanceDelivery(order.id,delStatus)} disabled={updatingId===order.id} className="bg-brand-brown hover:bg-brand-orange disabled:opacity-50 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]">
                          {updatingId===order.id?<Loader2 className="w-3 h-3 animate-spin"/>:<span>→ {D_LABELS[delNext]}</span>}
                        </button>
                      )}
                      {order.payment_status==="pending"&&!isCancelled&&(
                        <button onClick={()=>markAsPaid(order.id)} disabled={markingPaidId===order.id} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]">
                          {markingPaidId===order.id?<Loader2 className="w-3 h-3 animate-spin"/>:<><Check className="w-3 h-3"/>Mark Paid</>}
                        </button>
                      )}
                      <button onClick={()=>setExpandedOrderId(isExpanded?null:order.id)} className="p-2 hover:bg-brand-brown/5 rounded-full text-brand-brown/40 hover:text-brand-brown cursor-pointer">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded?"rotate-180 text-brand-brown":""}`}/>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-brand-brown/5 bg-brand-oat/10 px-6 py-5 flex flex-col gap-4">
                      {/* Items */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-brown/35">Items</span>
                        {order.order_items?.map(item=>(
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed border-brand-brown/10 last:border-0">
                            <div className="flex items-center gap-2"><span className="font-serif text-sm font-black text-brand-brown/40 w-8">{item.quantity}×</span><span className="text-xs font-bold text-brand-brown/85">{item.product_name}</span></div>
                            <span className="text-xs font-black text-brand-brown">{fmt(item.quantity*item.unit_price_paise)}</span>
                          </div>
                        ))}
                        <div className="flex justify-end pt-1"><span className="text-sm font-serif font-black text-brand-brown">Total: {fmt(order.total_paise)}</span></div>
                      </div>

                      {/* Customer note */}
                      {order.notes && <div className="bg-brand-orange/5 border border-brand-orange/15 rounded-2xl p-4"><span className="text-[9px] font-black uppercase tracking-widest text-brand-orange block mb-1">Customer Note</span><p className="text-xs font-medium text-brand-brown italic">&quot;{order.notes}&quot;</p></div>}

                      {/* Admin notes */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-brown/35 flex items-center gap-1"><StickyNote className="w-3 h-3"/>Admin Notes</label>
                        <div className="flex gap-2">
                          <textarea rows={2} value={noteVal} onChange={e=>setPendingNotes(p=>({...p,[order.id]:e.target.value}))} placeholder="Internal note (not visible to customer)…" className="flex-1 bg-white border border-brand-brown/10 rounded-xl px-3 py-2 text-xs font-bold text-brand-brown placeholder:text-brand-brown/25 outline-none focus:border-brand-orange transition-colors resize-none shadow-sm"/>
                          <button onClick={()=>saveAdminNote(order.id)} disabled={savingNoteId===order.id||noteVal===(order.admin_notes||"")} className="px-4 rounded-xl bg-brand-brown text-white hover:bg-brand-orange text-[9px] font-black uppercase transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center">
                            {savingNoteId===order.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Send className="w-3.5 h-3.5"/>}
                          </button>
                        </div>
                      </div>

                      {/* Baker + actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-brand-brown/10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40">Baker:</span>
                          <div className="relative">
                            <select value={order.baker_id||""} onChange={e=>assignBaker(order.id,e.target.value||null)} className="appearance-none text-xs font-bold text-brand-brown bg-white border border-brand-brown/15 rounded-xl pl-3 pr-7 py-1.5 outline-none focus:border-brand-orange cursor-pointer shadow-sm">
                              <option value="">Unassigned</option>
                              {bakers.filter(b=>b.is_active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-brown/40 pointer-events-none"/>
                          </div>
                          {assignedBaker&&<a href={`tel:${assignedBaker.phone}`} className="inline-flex items-center gap-1.5 text-xs text-brand-orange font-bold hover:underline"><Phone className="w-3.5 h-3.5 text-brand-orange"/>{assignedBaker.phone}</a>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.payment_status==="paid"&&(
                            <button onClick={()=>resendInvoice(order.id)} disabled={resendingId===order.id} className="inline-flex items-center gap-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50">
                              {resendingId===order.id?<Loader2 className="w-3 h-3 animate-spin"/>:<><FileText className="w-3 h-3"/>Resend Invoice</>}
                            </button>
                          )}
                          {order.invoice_url&&<a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-brand-brown/5 border border-brand-brown/10 hover:bg-brand-brown hover:text-white text-brand-brown/70 text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all"><FileText className="w-3 h-3"/>PDF</a>}
                          {order.borzo_tracking_url&&<a href={order.borzo_tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl border border-sky-200 hover:border-sky-600 transition-all"><Activity className="w-3 h-3"/>Borzo Track</a>}
                          {customerPhone&&<a href={`https://wa.me/91${customerPhone.replace(/\D/g,"")}?text=Hi%20${encodeURIComponent(order.customer_name)}%2C%20your%20WWY%20order%20${encodeURIComponent(order.order_number||"")}%3A%20`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl border border-emerald-200/50 hover:border-emerald-600 transition-all"><MessageCircle className="w-3 h-3"/>WA</a>}
                          {!isCancelled&&<button onClick={()=>{setActionOrder(order);setDeliveryDateInput(order.delivery_date||"");setModal("edit-delivery");}} className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl border border-sky-200 hover:border-sky-600 transition-all cursor-pointer"><CalendarDays className="w-3 h-3"/>Date</button>}
                          {!isCancelled&&order.delivery_status!=="delivered"&&<button onClick={()=>{setActionOrder(order);setModal("cancel-order");}} className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl border border-rose-200 hover:border-rose-600 transition-all cursor-pointer"><XCircle className="w-3 h-3"/>Cancel</button>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages>1&&(
              <div className="flex items-center justify-between pt-2">
                <button onClick={()=>setOrderPage(p=>Math.max(1,p-1))} disabled={orderPage===1} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-brand-brown/10 text-xs font-black text-brand-brown/60 hover:text-brand-brown disabled:opacity-30 cursor-pointer shadow-sm"><ChevronLeft className="w-4 h-4"/>Prev</button>
                <span className="text-xs font-bold text-brand-brown/50">Page {orderPage} of {totalPages} · {filteredOrders.length} orders</span>
                <button onClick={()=>setOrderPage(p=>Math.min(totalPages,p+1))} disabled={orderPage===totalPages} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-brand-brown/10 text-xs font-black text-brand-brown/60 hover:text-brand-brown disabled:opacity-30 cursor-pointer shadow-sm">Next<ChevronRight className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {!loading&&tab==="products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
            {filteredProducts.length===0&&<div className="col-span-full text-center py-16 bg-white border border-brand-brown/10 rounded-[2rem] shadow-sm"><span className="text-3xl block mb-2">🍞</span><p className="text-sm font-bold text-brand-brown/40 mb-4">No products yet.</p><button onClick={openAddProduct} className="inline-flex items-center gap-2 px-5 py-3 bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase rounded-2xl cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add First Product</button></div>}
            {filteredProducts.map(p=>(
              <div key={p.id} className="bg-white rounded-[2rem] border border-brand-brown/10 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest bg-brand-orange/10 px-2.5 py-0.5 rounded-md">{p.category}</span>
                    <h3 className="font-serif text-lg font-black text-brand-brown mt-2 leading-tight">{p.name}</h3>
                    {p.description&&<p className="text-xs text-brand-brown/50 font-medium mt-1 leading-snug">{p.description}</p>}
                  </div>
                  <span className="font-serif text-lg font-black text-brand-brown shrink-0 bg-brand-oat/55 px-3 py-1 rounded-xl">{fmt(p.price_paise)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-brand-brown/10 pt-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.available?"bg-emerald-500 animate-pulse":"bg-zinc-300"}`}/>
                    <span className="text-xs font-bold text-brand-brown/50">{p.available?"Active":"Hidden"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>toggleAvailability(p.id,p.available)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${p.available?"bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-rose-50 hover:text-rose-600":"bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}>{p.available?"Deactivate":"Activate"}</button>
                    <button onClick={()=>openEditProduct(p)} className="p-1.5 rounded-xl border border-brand-brown/10 hover:bg-brand-brown/5 text-brand-brown/40 hover:text-brand-brown cursor-pointer"><Edit2 className="w-3 h-3"/></button>
                    <button onClick={()=>setDeleteConfirmId(p.id)} className="p-1.5 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-300 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {!loading&&tab==="customers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {sortedCustomers.length===0&&<p className="text-center text-xs font-bold text-brand-brown/40 col-span-full py-12">No customers found.</p>}
            {sortedCustomers.map(c=>{
              const orderCount = orders.filter(o=>o.flat_number===c.flat_number).length;
              const totalSpend = orders.filter(o=>o.flat_number===c.flat_number&&o.payment_status==="paid").reduce((s,o)=>s+o.total_paise,0);
              return (
                <div key={c.id} className="bg-white rounded-[2rem] border border-brand-brown/10 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h4 className="font-serif text-base font-black text-brand-brown leading-tight">{c.name}</h4>
                      {orderCount>=3&&<span className="text-[9px] font-black text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-lg uppercase tracking-widest">Top patron 🌾</span>}
                    </div>
                    <p className="text-xs font-bold text-brand-brown/50">Flat {c.flat_number}</p>
                    {c.phone&&<a href={`https://wa.me/91${c.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange inline-flex items-center gap-1.5 text-[11px] mt-1 font-bold text-brand-brown/50 bg-brand-brown/5 px-2.5 py-1 rounded-xl"><Phone className="w-3 h-3 text-brand-orange"/>{c.phone}</a>}
                    {c.address&&<p className="text-[10px] text-brand-brown/40 font-medium mt-1.5">{c.address}</p>}
                    {c.pincode&&<p className="text-[10px] text-brand-brown/40 font-medium">{c.pincode}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right bg-brand-oat/25 border border-brand-brown/10 p-3 rounded-2xl min-w-[95px] shadow-sm">
                      <p className="text-[8px] font-black text-brand-brown/40 uppercase tracking-widest">Spent</p>
                      <p className="font-serif text-base font-black text-brand-brown">{fmt(totalSpend)}</p>
                      <p className="text-[10px] font-bold text-brand-orange mt-0.5">{orderCount} order{orderCount!==1?"s":""}</p>
                    </div>
                    <button onClick={()=>openEditCustomer(c)} className="p-2 rounded-xl border border-brand-brown/10 hover:bg-brand-brown/5 text-brand-brown/40 hover:text-brand-brown cursor-pointer"><Edit2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BAKERS ── */}
        {!loading&&tab==="bakers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {bakers.length===0&&<div className="col-span-full text-center py-16 bg-white border border-brand-brown/10 rounded-[2rem] shadow-sm"><span className="text-3xl block mb-2">👨‍🍳</span><p className="text-sm font-bold text-brand-brown/40 mb-4">No bakers yet.</p><button onClick={openAddBaker} className="inline-flex items-center gap-2 px-5 py-3 bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase rounded-2xl cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add First Baker</button></div>}
            {bakers.map(b=>{
              const dashUrl=`${typeof window!=="undefined"?window.location.origin:""}/baker/${b.share_token}`;
              const isCopied=copiedBakerId===b.id;
              const stats = bakerStats[b.id]||{active:0,delivered:0,revenue:0};
              return (
                <div key={b.id} className="bg-white rounded-[2rem] border border-brand-brown/10 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif text-base font-black text-brand-brown">{b.name}</h4>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${b.is_active?"bg-emerald-50 text-emerald-700 border border-emerald-200/50":"bg-zinc-100 text-zinc-400 border border-zinc-200/50"}`}>{b.is_active?"Active":"Inactive"}</span>
                        {bakerHolidays[b.id]&&<span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">On Holiday</span>}
                        {stats.active>0&&<span className="text-[9px] font-black text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">{stats.active} active</span>}
                      </div>
                      <a href={`tel:${b.phone}`} className="text-xs font-bold text-brand-brown/50 hover:text-brand-orange inline-flex items-center gap-1.5 mt-2"><Phone className="w-3.5 h-3.5 text-brand-orange"/>{b.phone}</a>
                      {b.pincodes&&b.pincodes.length>0&&<p className="text-[10px] font-bold text-brand-brown/40 mt-1">{b.pincodes.join(", ")}</p>}
                      {b.daily_capacity&&<p className="text-[10px] font-bold text-brand-brown/40">Capacity: {b.daily_capacity}/day</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={()=>openEditBaker(b)} className="p-2 rounded-xl border border-brand-brown/10 hover:bg-brand-brown/5 text-brand-brown/40 hover:text-brand-brown cursor-pointer"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>toggleBakerActive(b.id,b.is_active)} className={`p-2 rounded-xl border cursor-pointer transition-colors ${b.is_active?"border-rose-100 hover:bg-rose-50 text-rose-300 hover:text-rose-600":"border-emerald-100 hover:bg-emerald-50 text-emerald-300 hover:text-emerald-600"}`}>{b.is_active?<XCircle className="w-3.5 h-3.5"/>:<CheckCircle className="w-3.5 h-3.5"/>}</button>
                      <button onClick={()=>{setDeletingBakerId(b.id);setModal("delete-baker");}} className="p-2 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-300 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  {/* Baker stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[{label:"Active",value:stats.active,color:"text-brand-orange"},{label:"Delivered",value:stats.delivered,color:"text-emerald-700"},{label:"Revenue",value:fmt(stats.revenue),color:"text-brand-brown"}].map(s=>(
                      <div key={s.label} className="bg-brand-oat/30 rounded-2xl px-3 py-2.5 text-center border border-brand-brown/10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-brown/40">{s.label}</p>
                        <p className={`font-serif text-base font-black ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-brand-oat/25 border border-brand-brown/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
                    <div className="min-w-0 flex-grow">
                      <p className="text-[8px] font-black text-brand-brown/40 uppercase tracking-widest mb-0.5">Baker Dashboard</p>
                      <a href={dashUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-orange hover:underline truncate block">/baker/{b.share_token.slice(0,10)}…</a>
                    </div>
                    <button onClick={()=>{navigator.clipboard.writeText(dashUrl);setCopiedBakerId(b.id);setTimeout(()=>setCopiedBakerId(null),2000);}} className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all cursor-pointer border ${isCopied?"bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse":"bg-white border-brand-brown/10 text-brand-brown/60 hover:text-brand-brown shadow-sm"}`}>{isCopied?<><Check className="w-3.5 h-3.5 text-emerald-600"/>Copied</>:<><Clipboard className="w-3.5 h-3.5"/>Copy</>}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {!loading&&tab==="analytics" && (
          <div className="flex flex-col gap-6 relative z-10">
            {/* Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white rounded-[2rem] p-5 border border-brand-brown/10 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40 shrink-0">Date Range</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={analyticsFrom} onChange={e=>setAnalyticsFrom(e.target.value)} className="bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-xs font-bold text-brand-brown outline-none focus:border-brand-orange"/>
                <span className="text-xs text-brand-brown/40 font-bold">to</span>
                <input type="date" value={analyticsTo} onChange={e=>setAnalyticsTo(e.target.value)} className="bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-xs font-bold text-brand-brown outline-none focus:border-brand-orange"/>
                {(analyticsFrom||analyticsTo)&&<button onClick={()=>{setAnalyticsFrom("");setAnalyticsTo("");}} className="text-[10px] font-black text-brand-brown/40 hover:text-brand-brown uppercase tracking-widest px-2.5 py-1 rounded-lg bg-brand-brown/5">Clear</button>}
              </div>
              {(analyticsFrom||analyticsTo)&&<span className="text-[10px] font-bold text-brand-orange ml-auto">Filtered range</span>}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {label:"Total Revenue",value:fmt(analytics.totalRevenue),sub:"all paid orders"},
                {label:"Total Orders",value:orders.filter(o=>o.payment_status==="paid").length,sub:"completed"},
                {label:"Avg Order Value",value:fmt(analytics.avgOrderValue),sub:"per order"},
                {label:"New Customers",value:analytics.newCustomers,sub:"last 30 days"},
              ].map(({label,value,sub})=>(
                <div key={label} className="bg-white rounded-[2rem] p-5 border border-brand-brown/10 shadow-sm flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40">{label}</span>
                  <span className="font-serif text-3xl font-black text-brand-brown tracking-tight">{value}</span>
                  <span className="text-[10px] font-bold text-brand-brown/40 mt-1">{sub}</span>
                </div>
              ))}
            </div>

            {/* Week comparison */}
            <div className="bg-white rounded-[2rem] p-6 border border-brand-brown/10 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-6 divide-x divide-brand-brown/10">
              <div><p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">This Week</p><p className="font-serif text-3xl font-black text-brand-brown">{fmt(analytics.thisWeekRevenue)}</p></div>
              <div className="pl-6"><p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">Last Week</p><p className="font-serif text-3xl font-black text-brand-brown/30">{fmt(analytics.lastWeekRevenue)}</p></div>
              {analytics.lastWeekRevenue>0&&<div className="pl-6"><p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">Change</p><p className={`font-serif text-3xl font-black ${analytics.thisWeekRevenue>=analytics.lastWeekRevenue?"text-emerald-600":"text-rose-600"}`}>{analytics.thisWeekRevenue>=analytics.lastWeekRevenue?"+":""}{(((analytics.thisWeekRevenue-analytics.lastWeekRevenue)/analytics.lastWeekRevenue)*100).toFixed(0)}%</p></div>}
            </div>

            {/* 7-day chart */}
            <div className="bg-white rounded-[2rem] p-6 border border-brand-brown/10 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-4">Revenue — Last 7 Days</p>
              <div className="flex items-end gap-3 h-36 pt-4">
                {analytics.revenueByDay.map(d=>(
                  <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                    {d.revenue>0&&<span className="text-[9px] font-black text-brand-brown/60">₹{(d.revenue/100).toFixed(0)}</span>}
                    <div className="w-full bg-brand-orange rounded-t-lg min-h-[3px] transition-all duration-500" style={{height:`${analytics.maxDayRevenue>0?Math.max((d.revenue/analytics.maxDayRevenue)*100,d.revenue>0?4:2):2}px`}}/>
                    <span className="text-[9px] font-bold text-brand-brown/40 whitespace-nowrap">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best sellers */}
            <div className="bg-white rounded-[2rem] p-6 border border-brand-brown/10 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-4">Best Sellers</p>
              {analytics.topProducts.length===0?<p className="text-sm font-bold text-brand-brown/30 text-center py-6">No sales data yet.</p>:(
                <div className="flex flex-col gap-4">
                  {analytics.topProducts.map((p,i)=>{
                    const maxQ=analytics.topProducts[0].qty;
                    return <div key={p.name} className="flex items-center gap-3">
                      <span className="w-6 text-[10px] font-black text-brand-brown/30 shrink-0">#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-black text-brand-brown truncate">{p.name}</span><span className="text-xs font-bold text-brand-brown/60 ml-2 shrink-0">{p.qty} sold · {fmt(p.revenue)}</span></div>
                        <div className="w-full bg-brand-orange/10 h-2 rounded-full overflow-hidden"><div className="bg-brand-orange h-full rounded-full transition-all duration-500" style={{width:`${(p.qty/maxQ)*100}%`}}/></div>
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {!loading&&tab==="feedback" && (
          <div className="flex flex-col gap-4 relative z-10">
            {feedbacks.length===0 && (
              <div className="text-center py-16 bg-white border border-brand-brown/10 rounded-[2rem] shadow-sm">
                <span className="text-3xl block mb-2">⭐</span>
                <p className="text-sm font-bold text-brand-brown/40">No feedback yet.</p>
                <p className="text-xs font-bold text-brand-brown/30 mt-1">Customer reviews will appear here once submitted.</p>
              </div>
            )}
            {feedbacks.map(fb=>(
              <div key={fb.id} className="bg-white rounded-[2rem] border border-brand-brown/10 p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-base font-black text-brand-brown">Flat {fb.flat_number}</p>
                    {fb.order_id&&<p className="text-[10px] font-bold text-brand-brown/40">Order #{fb.order_id.slice(0,8)}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(n=>(
                      <Star key={n} className={`w-4 h-4 ${n<=fb.rating?"text-brand-orange fill-brand-orange":"text-brand-brown/15"}`}/>
                    ))}
                  </div>
                </div>
                {fb.comment&&<p className="text-sm font-medium text-brand-brown/70 italic bg-brand-oat/30 border border-brand-brown/5 rounded-2xl px-4 py-3">&quot;{fb.comment}&quot;</p>}
                <p className="text-[10px] font-bold text-brand-brown/30">{fmtDate(fb.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {!loading&&tab==="settings" && (
          <div className="flex flex-col gap-6 relative z-10">

            {/* Known settings */}
            <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">Store Settings</p>
              {[
                {key:"vacation_mode",label:"Vacation Mode",desc:"true / false — pauses all new orders",placeholder:"true"},
                {key:"min_order_paise",label:"Min Order (paise)",desc:"e.g. 20000 = ₹200 minimum",placeholder:"20000"},
                {key:"delivery_days",label:"Delivery Days",desc:"Comma-separated: wed,sat",placeholder:"wed,sat"},
                {key:"cutoff_hour_ist",label:"Order Cutoff Hour (IST)",desc:"24h integer, e.g. 20 = 8 PM",placeholder:"20"},
              ].map(({key,label,desc,placeholder})=>{
                const current = settingValues[key]??"";
                const edited = settingEdits[key];
                const val = edited!==undefined ? edited : current;
                const isDirty = edited!==undefined && edited!==current;
                const isSaving = savingSettingKey===key;
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-brand-brown/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-brand-brown">{label}</p>
                      <p className="text-[10px] font-bold text-brand-brown/40 mt-0.5">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        value={val}
                        placeholder={placeholder}
                        onChange={e=>setSettingEdits(p=>({...p,[key]:e.target.value}))}
                        className="w-40 bg-brand-oat/40 border border-brand-brown/15 rounded-xl px-3 py-2 text-xs font-bold text-brand-brown outline-none focus:border-brand-orange transition-colors"
                      />
                      <button
                        onClick={()=>saveSetting(key)}
                        disabled={!isDirty||isSaving}
                        className="px-4 py-2 rounded-xl bg-brand-brown hover:bg-brand-orange text-white text-[10px] font-black uppercase disabled:opacity-30 cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        {isSaving?<Loader2 className="w-3 h-3 animate-spin"/>:<Send className="w-3 h-3"/>}
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin actions */}
            <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">Admin Actions</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={runCron} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-oat/50 border border-brand-brown/10 hover:bg-brand-brown hover:text-white text-brand-brown/70 text-xs font-black uppercase px-5 py-3 rounded-2xl transition-all cursor-pointer">
                  <RefreshCw className="w-4 h-4"/>Run Cron Manually
                </button>
                <button onClick={exportCSV} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-oat/50 border border-brand-brown/10 hover:bg-brand-brown hover:text-white text-brand-brown/70 text-xs font-black uppercase px-5 py-3 rounded-2xl transition-all cursor-pointer">
                  <Download className="w-4 h-4"/>Export Orders CSV
                </button>
              </div>
            </div>

            {/* Active WhatsApp sessions */}
            <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40">Active WhatsApp Sessions</p>
                <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-lg">{sessions.length} sessions</span>
              </div>
              {sessions.length===0&&<p className="text-sm font-bold text-brand-brown/30 text-center py-6">No active sessions.</p>}
              {sessions.map(s=>{
                const stepAge = Math.round((Date.now()-new Date(s.updated_at).getTime())/60000);
                const isStale = stepAge > 60;
                return (
                  <div key={s.phone} className={`flex items-start justify-between gap-3 py-3 border-b border-brand-brown/5 last:border-0 ${isStale?"opacity-50":""}`}>
                    <div>
                      <p className="text-xs font-black text-brand-brown">{s.phone}</p>
                      <p className="text-[10px] font-bold text-brand-brown/50 mt-0.5">Step: <span className="text-brand-orange">{s.step}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-brand-brown/40">{stepAge}m ago</p>
                      {isStale&&<p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Stale</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All raw settings */}
            {settings.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-brand-brown/10 p-6 shadow-sm flex flex-col gap-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-brown/40 mb-1">All DB Settings</p>
                {settings.map(s=>(
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-dashed border-brand-brown/5 last:border-0">
                    <span className="text-xs font-bold text-brand-brown/60 font-mono">{s.key}</span>
                    <span className="text-xs font-black text-brand-brown bg-brand-oat/40 px-2.5 py-0.5 rounded-lg">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

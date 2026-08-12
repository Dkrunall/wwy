"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmt, fmtDate, D_LABELS, D_THEME, PAY_THEME } from "@/lib/orderDisplay";
import OmsSidebar, { OMS_NAV, type OmsTab } from "@/components/OmsSidebar";
import {
  Users, Clock, CheckCircle, TrendingUp, RefreshCw,
  ChevronDown, Phone, Clipboard, Check, Search, X,
  Loader2, Edit2, Trash2, Plus, XCircle, MessageCircle, ArrowRight,
  Download, Send, ChevronLeft, ChevronRight, Star, Bell, Zap,
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
interface Product { id: string; name: string; category: string; description?: string | null; price_paise: number; available: boolean; image_url?: string | null; }
interface Customer { id: string; name: string; flat_number: string; phone: string | null; address?: string | null; pincode?: string | null; created_at: string; }
interface Baker { id: string; name: string; email?: string | null; phone: string; is_active: boolean; share_token: string; pincodes?: string[]; daily_capacity?: number; address?: string | null; lat?: number | null; lng?: number | null; }
interface Setting { key: string; value: string; }
interface Feedback { id: string; order_id: string | null; flat_number: string; rating: number; comment: string | null; created_at: string; }
interface Session { phone: string; step: string; cart: unknown; temp: unknown; updated_at: string; }

type Tab = OmsTab;
type ModalType = "add-product" | "edit-product" | "add-baker" | "edit-baker" | "edit-customer" | "delete-baker" | null;

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ORDERS_PER_PAGE = 20;

export default function OmsDashboard() {
  return (
    <Suspense fallback={null}>
      <OmsDashboardInner />
    </Suspense>
  );
}

function OmsDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return t && OMS_NAV.some(n => n.key === t) ? (t as Tab) : "orders";
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSort, setOrderSort] = useState<"newest"|"oldest"|"amount"|"delivery">("newest");
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

  // Action states
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBaker, setEditingBaker] = useState<Baker | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [productForm, setProductForm] = useState({name:"",category:"",description:"",price:"",available:true,image_url:""});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [bakerForm, setBakerForm] = useState({name:"",email:"",phone:"",pincodes:"",daily_capacity:"20",is_active:true,address:"",lat:"",lng:""});
  const [customerForm, setCustomerForm] = useState({name:"",phone:"",address:"",pincode:""});
  const [formSaving, setFormSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Notification center
  interface Notif { id: string; title: string; body: string | null; read: boolean; created_at: string; }
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const unreadCount = notifs.filter(n => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) { const d = await res.json(); setNotifs(d.notifications || []); }
    } finally { setNotifLoading(false); }
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(iv);
  }, [fetchNotifs]);

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
      supabase.from("orders").select("*, order_items(*)").order("created_at",{ascending:false}).limit(500),
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
      if(count && count > orders.length && orders.length < 500) setNewOrdersAlert(count - orders.length);
    }, 30000);
    return ()=>clearInterval(iv);
  },[orders.length]);

  const toggleVacation = async () => {
    setVacationLoading(true);
    const nv = !vacationMode;
    await fetch("/api/oms/vacation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:nv})});
    setVacationMode(nv); setVacationLoading(false);
  };
  const suggestedBakerFor = (pincode?: string | null) =>
    pincode ? bakers.find(b=>b.is_active && b.pincodes?.includes(pincode)) || null : null;
  const sortByPincodeMatch = (pincode?: string | null) =>
    [...bakers.filter(b=>b.is_active)].sort((a,b)=>{
      const aMatch = pincode && a.pincodes?.includes(pincode) ? 0 : 1;
      const bMatch = pincode && b.pincodes?.includes(pincode) ? 0 : 1;
      return aMatch - bMatch;
    });
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
  const toggleSelectAllVisible = (ids: string[], allSelected: boolean) => {
    setSelectedIds(p=>{
      const n=new Set(p);
      ids.forEach(id=> allSelected ? n.delete(id) : n.add(id));
      return n;
    });
  };

  // ── Product CRUD ──
  const openAddProduct = () => { setEditingProduct(null); setProductForm({name:"",category:"",description:"",price:"",available:true,image_url:""}); setFormError(""); setImageUploadError(""); setModal("add-product"); };
  const openEditProduct = (p: Product) => { setEditingProduct(p); setProductForm({name:p.name,category:p.category,description:p.description||"",price:(p.price_paise/100).toString(),available:p.available,image_url:p.image_url||""}); setFormError(""); setImageUploadError(""); setModal("edit-product"); };
  const uploadProductImage = async (file: File) => {
    setImageUploadError("");
    setImageUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/oms/products/upload-image", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) { setImageUploadError(data.error || "Upload failed."); return; }
      setProductForm(f=>({...f,image_url:data.url}));
    } catch {
      setImageUploadError("Upload failed.");
    } finally {
      setImageUploading(false);
    }
  };
  const saveProduct = async () => {
    const price_paise = Math.round(parseFloat(productForm.price)*100);
    if(!productForm.name.trim()){setFormError("Name required.");return;}
    if(!productForm.category.trim()){setFormError("Category required.");return;}
    if(isNaN(price_paise)||price_paise<=0){setFormError("Valid price required.");return;}
    setFormSaving(true);
    const payload = {name:productForm.name.trim(),category:productForm.category.trim(),description:productForm.description.trim()||null,price_paise,available:productForm.available,image_url:productForm.image_url.trim()||null};
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
  const openAddBaker = () => { setEditingBaker(null); setBakerForm({name:"",email:"",phone:"",pincodes:"",daily_capacity:"20",is_active:true,address:"",lat:"",lng:""}); setFormError(""); setModal("add-baker"); };
  const openEditBaker = (b: Baker) => { setEditingBaker(b); setBakerForm({name:b.name,email:b.email||"",phone:b.phone,pincodes:(b.pincodes||[]).join(", "),daily_capacity:String(b.daily_capacity||20),is_active:b.is_active,address:b.address||"",lat:b.lat!=null?String(b.lat):"",lng:b.lng!=null?String(b.lng):""}); setFormError(""); setModal("edit-baker"); };
  const saveBaker = async () => {
    if(!bakerForm.name.trim()){setFormError("Name required.");return;}
    if(!bakerForm.phone.trim()){setFormError("Phone required.");return;}
    setFormSaving(true);
    const pincodes = bakerForm.pincodes.split(",").map(p=>p.trim()).filter(Boolean);
    const payload = {name:bakerForm.name.trim(),email:bakerForm.email.trim()||null,phone:bakerForm.phone.trim(),pincodes,daily_capacity:parseInt(bakerForm.daily_capacity)||20,is_active:bakerForm.is_active,address:bakerForm.address.trim()||null,lat:bakerForm.lat?parseFloat(bakerForm.lat):null,lng:bakerForm.lng?parseFloat(bakerForm.lng):null};
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

  const selectedPincodes = useMemo(()=>{
    const selected = orders.filter(o=>selectedIds.has(o.id));
    const pincodes = selected.map(o=>customers.find(c=>c.flat_number===o.flat_number)?.pincode).filter(Boolean) as string[];
    return [...new Set(pincodes)];
  },[orders,customers,selectedIds]);
  const bulkSuggestedBaker = selectedPincodes.length===1 ? suggestedBakerFor(selectedPincodes[0]) : null;
  const bulkSortedBakers = sortByPincodeMatch(selectedPincodes.length===1 ? selectedPincodes[0] : null);

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

  const closeModal = () => { setModal(null); setEditingProduct(null); setEditingBaker(null); setEditingCustomer(null); setDeletingBakerId(null); setFormError(""); };


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
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Product Image</label>
                  <div className="flex items-center gap-3">
                    {productForm.image_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-brown/10 shrink-0 bg-brand-oat/30">
                        <Image src={productForm.image_url} alt="Product" fill className="object-cover"/>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-brand-brown/20 shrink-0 flex items-center justify-center text-brand-brown/20">
                        <span className="text-[9px] font-black uppercase">No image</span>
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-brand-brown/15 hover:bg-brand-brown/5 text-xs font-black uppercase tracking-wider text-brand-brown/60 cursor-pointer transition-all">
                      {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : (productForm.image_url ? "Replace" : "Upload")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        disabled={imageUploading}
                        onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadProductImage(f); e.target.value=""; }}
                      />
                    </label>
                  </div>
                  {imageUploadError && <p className="text-[10px] font-bold text-rose-600">{imageUploadError}</p>}
                </div>
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
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 overflow-y-auto max-h-[90vh]" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-black text-brand-brown">{modal==="add-baker"?"Add Baker":"Edit Baker"}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-brand-brown/5 rounded-full"><X className="w-4 h-4 text-brand-brown/50"/></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Name</label><input className={inputCls} autoFocus placeholder="Priya Mehta" value={bakerForm.name} onChange={e=>setBakerForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-black uppercase tracking-widest text-brand-brown/50">Email <span className="normal-case font-bold text-brand-brown/30">(for order notifications)</span></label><input className={inputCls} type="email" placeholder="baker@example.com" value={bakerForm.email} onChange={e=>setBakerForm(f=>({...f,email:e.target.value}))}/></div>
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

      {/* ── NOTIFICATION PANEL ── */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setNotifOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-brown/60" />
                <p className="font-black text-brand-brown text-sm">Notifications</p>
                {unreadCount > 0 && <span className="bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{unreadCount}</span>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-wider text-brand-brown/40 hover:text-brand-brown transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifLoading && notifs.length === 0 ? (
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest text-center py-12 animate-pulse">Loading…</p>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Bell className="w-10 h-10 text-gray-200" />
                  <p className="text-xs font-black text-gray-300">No notifications yet</p>
                </div>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-5 py-3.5 border-b border-gray-50 last:border-0 ${!n.read ? "bg-brand-oat/40" : ""}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.read ? "font-bold text-gray-500" : "font-black text-brand-brown"}`}>{n.title}</p>
                      {n.body && <p className="text-xs text-gray-400 font-medium mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-gray-300 font-bold mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-brand-orange rounded-full shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <OmsSidebar
        activeTab={tab}
        onTabSelect={(t) => { setTab(t); setSearchQuery(""); }}
        unreadCount={unreadCount}
        onBellClick={() => { setNotifOpen(true); fetchNotifs(); }}
        vacationMode={vacationMode}
        vacationLoading={vacationLoading}
        onToggleVacation={toggleVacation}
        onCron={runCron}
        onRefresh={fetchData}
        refreshing={loading}
        onLogout={logout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* ── MAIN ── */}
      <main className="md:ml-72 flex-1 w-auto min-w-0 py-8 px-6 sm:px-10 xl:px-12 relative">
        {/* Background elegant dot overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2 relative z-10">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-brand-brown tracking-tight">Artisan OMS Dashboard</h1>
            <p className="text-xs font-bold text-brand-brown/50 uppercase tracking-widest mt-1">Wild Wild Yeast · Master Management System</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-brand-brown/10 px-5 py-3 rounded-2xl shrink-0 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping"/>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black uppercase text-brand-orange tracking-widest">BREAD TIME</span>
              <span className="text-sm font-black font-mono text-brand-brown">{breadTime}</span>
            </div>
          </div>
        </div>

        {vacationMode && <div className="mb-6 bg-brand-orange/10 border-2 border-brand-orange/20 rounded-3xl px-6 py-4 text-xs font-black text-brand-brown flex items-center gap-3 animate-pulse"><span className="text-xl">🌾</span><div><p className="font-serif font-black uppercase tracking-wider">Vacation mode is active</p><p className="text-brand-brown/70 font-bold mt-0.5">Storefront orders are paused.</p></div></div>}

        {/* New orders alert */}
        {newOrdersAlert > 0 && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-200 rounded-3xl px-6 py-4 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5"><Bell className="w-5 h-5 text-emerald-600"/><p className="text-sm font-black text-emerald-800">{newOrdersAlert} new order{newOrdersAlert>1?"s":""} arrived</p></div>
            <button onClick={()=>fetchData()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"><RefreshCw className="w-3.5 h-3.5"/>Refresh</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8 relative z-10">
          {[
            {label:"Pending Payment",value:pending,unit:"orders",icon:Clock,color:"text-amber-700",bg:"bg-amber-500/10 border-amber-500/20",bar:"bg-amber-500",pct:orders.length>0?pending/orders.length:0},
            {label:"Paid & Confirmed",value:confirmed,unit:"ready",icon:CheckCircle,color:"text-emerald-700",bg:"bg-emerald-500/10 border-emerald-500/20",bar:"bg-emerald-500",pct:orders.length>0?confirmed/orders.length:0},
            {label:"Today Revenue",value:fmt(todayRevenue),unit:"paid",icon:TrendingUp,color:"text-brand-brown",bg:"bg-brand-orange/10 border-brand-orange/20",bar:"bg-brand-orange",pct:1},
            {label:"Total Customers",value:customers.length,unit:"accounts",icon:Users,color:"text-brand-brown",bg:"bg-brand-brown/5 border-brand-brown/15",bar:"bg-brand-brown/40",pct:1},
          ].map(({label,value,unit,icon:Icon,bg,bar,pct})=>(
            <div key={label} className="relative overflow-hidden bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-brand-brown/10 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[145px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40 leading-none">{label}</span>
                  <div className={`p-2 rounded-2xl ${bg} border`}>
                    <Icon className="w-4 h-4 text-brand-brown/70"/>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-serif text-3xl sm:text-4xl font-black text-brand-brown tracking-tight">{value}</span>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${bg}`}>{unit}</span>
                <div className="w-full bg-brand-brown/5 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className={`${bar} h-full rounded-full transition-all duration-500`} style={{width:`${Math.min(pct*100,100)}%`}}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden gap-1.5 mb-6 bg-brand-brown/5 rounded-2xl p-1 overflow-x-auto">
          {OMS_NAV.map(({key:t,label})=>(
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

        {/* Bulk assignment bar — fixed, not sticky: Lenis smooth-scroll on this site breaks position:sticky */}
        {tab==="orders" && selectedIds.size>0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-3 bg-brand-brown text-white rounded-2xl px-4 py-3 shadow-2xl w-[calc(100%-2rem)] max-w-2xl">
            <span className="text-xs font-black">{selectedIds.size} selected</span>
            <div className="relative flex-1 max-w-[200px]">
              <select value={bulkBakerId} onChange={e=>setBulkBakerId(e.target.value)} className="w-full appearance-none text-xs font-bold bg-white/10 border border-white/20 rounded-xl pl-3 pr-7 py-1.5 text-white outline-none focus:border-white/50 cursor-pointer">
                <option value="">— Pick baker —</option>
                {bulkSortedBakers.map(b=>(
                  <option key={b.id} value={b.id}>{b.name}{selectedPincodes.length===1 && b.pincodes?.includes(selectedPincodes[0]) ? " ✓ covers pincode" : ""}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50 pointer-events-none"/>
            </div>
            {bulkSuggestedBaker && bulkBakerId!==bulkSuggestedBaker.id && (
              <button onClick={()=>setBulkBakerId(bulkSuggestedBaker.id)} className="text-[10px] font-black uppercase tracking-wider text-emerald-300 hover:text-emerald-200 underline decoration-dotted cursor-pointer whitespace-nowrap">
                Suggested: {bulkSuggestedBaker.name}
              </button>
            )}
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

            {pagedOrders.length>0 && (() => {
              const visibleIds = pagedOrders.map(o=>o.id);
              const allVisibleSelected = visibleIds.every(id=>selectedIds.has(id));
              return (
                <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-brand-brown/10 bg-brand-oat/30 text-[10px] font-black uppercase tracking-wider text-brand-brown/50">
                          <th className="pl-6 pr-3 py-4 w-12">
                            <div onClick={()=>toggleSelectAllVisible(visibleIds, allVisibleSelected)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-110 ${allVisibleSelected?"bg-brand-brown border-brand-brown":"border-brand-brown/25 bg-white hover:border-brand-brown/50"}`}>
                              {allVisibleSelected&&<Check className="w-3.5 h-3.5 text-white"/>}
                            </div>
                          </th>
                          <th className="px-4 py-4">Customer &amp; Flat</th>
                          <th className="px-4 py-4">Status &amp; Delivery</th>
                          <th className="px-4 py-4">Items &amp; Total</th>
                          <th className="px-4 py-4">Scheduled Date</th>
                          <th className="px-4 py-4">Baker</th>
                          <th className="pr-6 pl-4 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-brown/5">
                        {pagedOrders.map(order=>{
                          const payTheme = PAY_THEME[order.payment_status||"pending"]||PAY_THEME.pending;
                          const delStatus = order.delivery_status||"placed";
                          const delTheme = D_THEME[delStatus]||D_THEME.placed;
                          const assignedBaker = bakers.find(b=>b.id===order.baker_id);
                          const isCancelled = order.status==="cancelled";
                          const isSelected = selectedIds.has(order.id);
                          const itemsSummary = (order.order_items || []).map(i => `${i.quantity}× ${i.product_name}`).join(", ");

                          return (
                            <tr
                              key={order.id}
                              onClick={()=>router.push(`/oms/orders/${order.id}`)}
                              className={`cursor-pointer transition-all ${isSelected?"bg-brand-orange/5":"hover:bg-brand-oat/20"}`}
                            >
                              <td className="pl-6 pr-3 py-4" onClick={e=>e.stopPropagation()}>
                                <div onClick={()=>toggleSelect(order.id)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-110 ${isSelected?"bg-brand-brown border-brand-brown":"border-brand-brown/25 bg-white hover:border-brand-brown/50"}`}>
                                  {isSelected&&<Check className="w-3.5 h-3.5 text-white"/>}
                                </div>
                              </td>

                              {/* Customer info */}
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-serif text-base font-black text-brand-brown">Flat {order.flat_number}</span>
                                  {order.source==="whatsapp"&&<span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0"><MessageCircle className="w-3 h-3"/>WA</span>}
                                </div>
                                <p className="text-xs font-bold text-brand-brown/70">{order.customer_name}</p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-brown/40 font-bold">
                                  <span className="font-mono bg-brand-brown/5 px-2 py-0.5 rounded text-brand-brown/60">{order.order_number||`#${order.id.slice(0,8).toUpperCase()}`}</span>
                                  <span>{fmtDate(order.created_at)}</span>
                                </div>
                              </td>

                              {/* Status pills */}
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <span className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${payTheme.bg} ${payTheme.text} ${payTheme.border}`}>
                                    Payment: {order.payment_status||"pending"}
                                  </span>
                                  {isCancelled ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-3 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                                      <XCircle className="w-3 h-3"/> Cancelled
                                    </span>
                                  ) : order.payment_status==="paid" && (
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full border ${delTheme.bg} ${delTheme.text} ${delTheme.border}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${delTheme.pulse} ${delStatus!=="delivered"?"animate-ping":""}`}/>
                                      {D_LABELS[delStatus]}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Items & Total */}
                              <td className="px-4 py-4">
                                <span className="font-serif font-black text-brand-brown text-base block">{fmt(order.total_paise)}</span>
                                <p className="text-xs text-brand-brown/50 font-medium line-clamp-1 max-w-[200px]" title={itemsSummary}>
                                  {itemsSummary || "No items"}
                                </p>
                              </td>

                              {/* Scheduled Date */}
                              <td className="px-4 py-4">
                                <span className="text-xs font-bold text-brand-brown/70">{order.delivery_date||"—"}</span>
                              </td>

                              {/* Baker */}
                              <td className="px-4 py-4">
                                <span className={`text-xs font-bold block ${assignedBaker?"text-brand-brown":"text-brand-brown/40 italic"}`}>
                                  {assignedBaker?assignedBaker.name:"Unassigned"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="pr-6 pl-4 py-4 text-right" onClick={e=>e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  {order.payment_status==="pending"&&!isCancelled&&(
                                    <button onClick={()=>markAsPaid(order.id)} disabled={markingPaidId===order.id} title="Mark Paid" className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer shadow-sm">
                                      {markingPaidId===order.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Check className="w-3.5 h-3.5"/>} Mark Paid
                                    </button>
                                  )}
                                  <Link href={`/oms/orders/${order.id}`} className="inline-flex items-center gap-1 bg-brand-brown/5 hover:bg-brand-brown hover:text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase text-brand-brown transition-all">
                                    View <ArrowRight className="w-3.5 h-3.5"/>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Pagination */}
            {totalPages>1&&(
              <div className="flex items-center justify-between pt-2">
                <button onClick={()=>setOrderPage(p=>Math.max(1,p-1))} disabled={orderPage===1} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-brand-brown/10 text-xs font-black text-brand-brown/60 hover:text-brand-brown disabled:opacity-30 cursor-pointer shadow-sm"><ChevronLeft className="w-4 h-4"/>Prev</button>
                <span className="text-xs font-bold text-brand-brown/50">Page {orderPage} of {totalPages} · {filteredOrders.length} orders</span>
                <button onClick={()=>setOrderPage(p=>Math.min(totalPages,p+1))} disabled={orderPage===totalPages} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-brand-brown/10 text-xs font-black text-brand-brown/60 hover:text-brand-brown disabled:opacity-30 cursor-pointer shadow-sm">Next<ChevronRight className="w-4 h-4"/></button>
              </div>
            )}
            {selectedIds.size>0 && <div className="h-20" />}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {!loading&&tab==="products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
            {filteredProducts.length===0&&<div className="col-span-full text-center py-16 bg-white border border-brand-brown/10 rounded-[2rem] shadow-sm"><span className="text-3xl block mb-2">🍞</span><p className="text-sm font-bold text-brand-brown/40 mb-4">No products yet.</p><button onClick={openAddProduct} className="inline-flex items-center gap-2 px-5 py-3 bg-brand-brown hover:bg-brand-orange text-white text-xs font-black uppercase rounded-2xl cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add First Product</button></div>}
            {filteredProducts.map(p=>(
              <div key={p.id} className="bg-white rounded-[2rem] border border-brand-brown/10 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  {p.image_url && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-brand-brown/10 shrink-0 bg-brand-oat/30">
                      <Image src={p.image_url} alt={p.name} fill className="object-cover"/>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
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

        {/* ── CUSTOMERS TABLE UI ── */}
        {!loading&&tab==="customers" && (
          <div className="bg-white rounded-3xl border border-brand-brown/10 shadow-sm overflow-hidden relative z-10">
            {sortedCustomers.length===0 ? (
              <div className="text-center py-16">
                <span className="text-3xl block mb-2">👤</span>
                <p className="text-sm font-bold text-brand-brown/40">No customers found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-brand-brown/10 bg-brand-oat/30 text-[10px] font-black uppercase tracking-wider text-brand-brown/50">
                      <th className="pl-6 py-4">Customer Name</th>
                      <th className="px-4 py-4">Flat Number</th>
                      <th className="px-4 py-4">Phone / Contact</th>
                      <th className="px-4 py-4">Address &amp; Pincode</th>
                      <th className="px-4 py-4 text-center">Orders</th>
                      <th className="px-4 py-4">Total Spent</th>
                      <th className="pr-6 pl-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-brown/5">
                    {sortedCustomers.map(c => {
                      const customerOrders = orders.filter(o => o.flat_number === c.flat_number);
                      const orderCount = customerOrders.length;
                      const totalSpend = customerOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_paise, 0);
                      const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

                      return (
                        <tr key={c.id} className="hover:bg-brand-oat/20 transition-colors">
                          {/* Name & Badge */}
                          <td className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-brown to-brand-orange text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-serif text-base font-black text-brand-brown">{c.name}</span>
                                  {orderCount >= 3 && (
                                    <span className="text-[9px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      VIP 🌾
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Flat */}
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs font-black text-brand-brown bg-brand-brown/5 px-2.5 py-1 rounded-full border border-brand-brown/10">
                              Flat {c.flat_number}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-4">
                            {c.phone ? (
                              <a
                                href={`https://wa.me/91${c.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> {c.phone}
                              </a>
                            ) : (
                              <span className="text-xs text-brand-brown/30 font-medium italic">No phone</span>
                            )}
                          </td>

                          {/* Address */}
                          <td className="px-4 py-4 max-w-[220px]">
                            <p className="text-xs text-brand-brown/70 font-medium truncate" title={c.address || ""}>
                              {c.address || "—"}
                            </p>
                            {c.pincode && <span className="text-[10px] font-mono text-brand-brown/40 block">📮 {c.pincode}</span>}
                          </td>

                          {/* Orders count */}
                          <td className="px-4 py-4 text-center">
                            <span className="text-xs font-black text-brand-brown bg-brand-oat px-2.5 py-1 rounded-full border border-brand-brown/10">
                              {orderCount}
                            </span>
                          </td>

                          {/* Total spent */}
                          <td className="px-4 py-4">
                            <span className="font-serif font-black text-base text-brand-orange">{fmt(totalSpend)}</span>
                          </td>

                          {/* Actions */}
                          <td className="pr-6 pl-4 py-4 text-right">
                            <button
                              onClick={() => openEditCustomer(c)}
                              className="p-2 rounded-xl border border-brand-brown/10 hover:bg-brand-brown/5 text-brand-brown/50 hover:text-brand-brown cursor-pointer transition-colors"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
                      {b.address
                        ?<p className="text-[10px] font-black text-emerald-700 inline-flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>Borzo pickup set</p>
                        :<p className="text-[10px] font-black text-amber-700 inline-flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"/>No pickup address — Borzo won&apos;t dispatch</p>
                      }
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

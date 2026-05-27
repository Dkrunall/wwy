import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { calculateDeliveryDate, formatDeliveryDate, deliveryDateISO } from "@/lib/dateUtils";
import { applyDiscounts } from "@/lib/discounts";
import { getRazorpay } from "@/lib/razorpay";
import { findBestBaker } from "@/lib/baker";
import Anthropic from "@anthropic-ai/sdk";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "wwy_verify";
const WA_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  deliveryDate: string;
}

// ── Webhook verification ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (
    searchParams.get("hub.mode") === "subscribe" &&
    searchParams.get("hub.verify_token") === VERIFY_TOKEN
  ) {
    return new NextResponse(searchParams.get("hub.challenge"), { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ── Incoming message handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = body?.entry?.[0]?.changes?.[0]?.value;
  if (!entry?.messages?.[0]) return NextResponse.json({ ok: true });

  const msg = entry.messages[0];
  const phone = msg.from;
  const text = (msg.text?.body || "").trim();

  await handleMessage(phone, text);
  return NextResponse.json({ ok: true });
}

// ── State machine ─────────────────────────────────────────────────────────────
async function handleMessage(phone: string, text: string) {
  const supabase = createServerSupabase();

  const { data: setting } = await supabase.from("settings").select("value").eq("key", "vacation_mode").single();
  if (setting?.value === "true") {
    await send(phone, "We are on a short break. Back soon! 🌾");
    return;
  }

  let { data: session } = await supabase.from("sessions").select("*").eq("phone", phone).single();
  if (!session) {
    session = { phone, step: "identify", cart: [], temp: {} };
    await supabase.from("sessions").insert(session);
  }

  const step = session.step as string;

  if (step === "identify") await stepIdentify(phone, session, supabase);
  else if (step === "collect_name") await stepCollectName(phone, text, session, supabase);
  else if (step === "collect_address") await stepCollectAddress(phone, text, session, supabase);
  else if (step === "collect_pincode") await stepCollectPincode(phone, text, session, supabase);
  else if (step === "menu") await stepMenu(phone, text, session, supabase);
  else if (step === "select_date") await stepSelectDate(phone, text, session, supabase);
  else if (step === "select_quantity") await stepSelectQuantity(phone, text, session, supabase);
  else if (step === "checkout") await stepCheckout(phone, text, session, supabase);
  else if (step === "confirm_order") await stepConfirmOrder(phone, text, session, supabase);
  else await supportFallback(phone, text, session, supabase);
}

async function updateSession(
  phone: string,
  update: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  await supabase.from("sessions").update({ ...update, updated_at: new Date().toISOString() }).eq("phone", phone);
}

async function send(to: string, message: string) {
  if (!WA_TOKEN || !PHONE_ID) return;
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  });
}

function formatISODate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

function parseDate(input: string): Date | null {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
  return isNaN(date.getTime()) ? null : date;
}

// ── Step handlers ─────────────────────────────────────────────────────────────

async function stepIdentify(
  phone: string,
  session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const { data: customer } = await supabase.from("customers").select("*").eq("phone", phone).single();
  if (customer) {
    await updateSession(phone, { step: "menu", temp: {} }, supabase);
    await send(phone, `Welcome back, ${customer.name}! 🌾\n\n${buildMenuMessage()}`);
  } else {
    await updateSession(phone, { step: "collect_name" }, supabase);
    await send(phone, "Welcome to Wild Wild Yeast! 🌾 We bake with love.\n\nFirst, what is your name?");
  }
}

async function stepCollectName(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const temp = (session.temp as Record<string, string>) || {};
  await updateSession(phone, { step: "collect_address", temp: { ...temp, name: text } }, supabase);
  await send(phone, `Nice to meet you, ${text}! 🙌\n\nWhat is your delivery address?`);
}

async function stepCollectAddress(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const temp = (session.temp as Record<string, string>) || {};
  await updateSession(phone, { step: "collect_pincode", temp: { ...temp, address: text } }, supabase);
  await send(phone, "And your pincode?");
}

async function stepCollectPincode(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const temp = (session.temp as Record<string, string>) || {};
  await supabase.from("customers").insert({
    phone, name: temp.name, address: temp.address, pincode: text, flat_number: phone.slice(-6),
  });
  await updateSession(phone, { step: "menu", temp: {}, cart: [] }, supabase);
  await send(phone, `You're all set, ${temp.name}! 🎉\n\n${buildMenuMessage()}`);
}

function buildMenuMessage(): string {
  return (
    "Here's what we have for you today 🍞\n\n" +
    "Reply with a number to add to your order:\n" +
    "1. Classic Sourdough Loaf — ₹280\n" +
    "2. Multigrain Sourdough — ₹320\n" +
    "3. Ginger Ale (500ml) — ₹150\n" +
    "4. Kombucha (500ml) — ₹180\n" +
    "5. Water Kefir (500ml) — ₹160\n" +
    "─────────────\n" +
    "Type 0 to Checkout"
  );
}

const MENU_PRODUCTS = [
  { id: "1", name: "Classic Sourdough Loaf", price: 28000 },
  { id: "2", name: "Multigrain Sourdough", price: 32000 },
  { id: "3", name: "Ginger Ale (500ml)", price: 15000 },
  { id: "4", name: "Kombucha (500ml)", price: 18000 },
  { id: "5", name: "Water Kefir (500ml)", price: 16000 },
];

async function stepMenu(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const cart = (session.cart as CartItem[]) || [];
  if (text === "0") {
    if (cart.length === 0) { await send(phone, "Your cart is empty! Add items first."); return; }
    await updateSession(phone, { step: "checkout" }, supabase);
    await send(phone, buildCartSummary(cart));
    return;
  }
  const idx = parseInt(text) - 1;
  if (idx >= 0 && idx < MENU_PRODUCTS.length) {
    const product = MENU_PRODUCTS[idx];
    const min = calculateDeliveryDate();
    const temp = (session.temp as Record<string, unknown>) || {};
    await updateSession(phone, {
      step: "select_date",
      temp: { ...temp, selected_product: JSON.stringify(product) },
    }, supabase);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const example = `${pad(min.getUTCDate())}/${pad(min.getUTCMonth() + 1)}/${min.getUTCFullYear()}`;
    await send(
      phone,
      `Great choice! *${product.name}* 🌾\n\nWhat delivery date would you like?\nEarliest available: *${formatDeliveryDate(min)}*\n\nWe deliver on Wednesdays and Saturdays only.\nReply in *DD/MM/YYYY* format (e.g. ${example})`
    );
  } else {
    await supportFallback(phone, text, session, supabase);
  }
}

async function stepSelectDate(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const date = parseDate(text);
  const min = calculateDeliveryDate();

  if (!date || date < min || ![3, 6].includes(date.getUTCDay())) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const example = `${pad(min.getUTCDate())}/${pad(min.getUTCMonth() + 1)}/${min.getUTCFullYear()}`;
    await send(
      phone,
      `Please enter a valid date — *Wednesday or Saturday*, on or after *${formatDeliveryDate(min)}*.\n\nFormat: *DD/MM/YYYY*\nExample: *${example}*`
    );
    return;
  }

  const temp = (session.temp as Record<string, unknown>) || {};
  await updateSession(phone, {
    step: "select_quantity",
    temp: { ...temp, selected_date: deliveryDateISO(date) },
  }, supabase);
  await send(phone, `Great — *${formatDeliveryDate(date)}* it is! 📅\n\nHow many would you like? (1–20)`);
}

async function stepSelectQuantity(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const qty = parseInt(text);
  if (isNaN(qty) || qty < 1 || qty > 20) {
    await send(phone, "Please enter a number between 1 and 20.");
    return;
  }

  const temp = (session.temp as Record<string, unknown>) || {};
  const productStr = temp.selected_product as string | undefined;
  const product = productStr ? (JSON.parse(productStr) as typeof MENU_PRODUCTS[0]) : null;
  const deliveryDate = temp.selected_date as string | undefined;

  if (!product || !deliveryDate) {
    await updateSession(phone, { step: "menu", temp: {} }, supabase);
    await send(phone, buildMenuMessage());
    return;
  }

  const cart = (session.cart as CartItem[]) || [];
  const existingIdx = cart.findIndex((i) => i.id === product.id && i.deliveryDate === deliveryDate);
  let newCart: CartItem[];
  if (existingIdx >= 0) {
    newCart = cart.map((item, i) =>
      i === existingIdx ? { ...item, qty: item.qty + qty } : item
    );
  } else {
    newCart = [...cart, { id: product.id, name: product.name, price: product.price, qty, deliveryDate }];
  }

  const newTemp = { ...(temp as Record<string, unknown>) };
  delete newTemp.selected_product;
  delete newTemp.selected_date;

  await updateSession(phone, { step: "menu", cart: newCart, temp: newTemp }, supabase);
  await send(
    phone,
    `✅ Added *${product.name}* ×${qty} for *${formatISODate(deliveryDate)}*\n\nCart: ${newCart.length} line(s). Continue ordering or type *0* to checkout.`
  );
}

function buildCartSummary(cart: CartItem[]): string {
  let subtotal = 0;
  let lines = "";
  cart.forEach((item, i) => {
    const lineTotal = item.qty * item.price;
    subtotal += lineTotal;
    lines += `${i + 1}. ${item.name} ×${item.qty} = ₹${(lineTotal / 100).toFixed(0)} (${formatISODate(item.deliveryDate)})\n`;
  });
  return (
    `Your order summary 🛒\n─────────────\n${lines}─────────────\n` +
    `TOTAL: ₹${(subtotal / 100).toFixed(0)}\n\n` +
    `To modify: *CHANGE {item} {qty}* — e.g. *CHANGE 1 3*\nTo remove: *CHANGE {item} 0*\n\n` +
    `Reply *CONFIRM* to pay or *CANCEL* to clear cart.`
  );
}

async function stepCheckout(
  phone: string, text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const upper = text.toUpperCase().trim();
  const cart = (session.cart as CartItem[]) || [];

  if (upper === "CANCEL") {
    await updateSession(phone, { step: "menu", cart: [] }, supabase);
    await send(phone, "Cart cleared. Starting fresh!\n\n" + buildMenuMessage());
    return;
  }

  if (upper === "CONFIRM") {
    await stepConfirmOrder(phone, text, session, supabase);
    return;
  }

  if (upper.startsWith("CHANGE")) {
    const parts = text.trim().split(/\s+/);
    const itemIdx = parseInt(parts[1]) - 1;
    const newQty = parseInt(parts[2]);
    if (isNaN(itemIdx) || isNaN(newQty) || itemIdx < 0 || itemIdx >= cart.length || newQty < 0 || newQty > 20) {
      await send(phone, "Format: *CHANGE {item number} {new qty}*\nExample: *CHANGE 1 3*\nTo remove: *CHANGE 1 0*");
      return;
    }
    const newCart = newQty === 0
      ? cart.filter((_, i) => i !== itemIdx)
      : cart.map((item, i) => i === itemIdx ? { ...item, qty: newQty } : item);
    if (newCart.length === 0) {
      await updateSession(phone, { step: "menu", cart: [] }, supabase);
      await send(phone, "Cart is now empty.\n\n" + buildMenuMessage());
      return;
    }
    await updateSession(phone, { cart: newCart }, supabase);
    await send(phone, buildCartSummary(newCart));
    return;
  }

  await send(phone, "Reply *CONFIRM* to pay, *CANCEL* to clear cart, or *CHANGE {item} {qty}* to modify.");
}

async function stepConfirmOrder(
  phone: string, _text: string, session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  const cart = (session.cart as CartItem[]) || [];
  if (cart.length === 0) { await send(phone, "Your cart is empty!"); return; }

  const { data: customer } = await supabase.from("customers").select("*").eq("phone", phone).single();
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const { finalTotal, discountPercent } = await applyDiscounts(customer?.id || "", subtotal);

  // Use earliest delivery date across cart items
  const deliveryISO = cart.reduce((min, item) =>
    item.deliveryDate < min ? item.deliveryDate : min, cart[0].deliveryDate
  );

  const year = new Date().getFullYear();
  const orderNumber = `WWY-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

  let rzpLink = "";
  try {
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: finalTotal,
      currency: "INR",
      notes: { phone, order_number: orderNumber },
    });

    const { data: order } = await supabase.from("orders").insert({
      customer_id: customer?.id || null,
      flat_number: customer?.flat_number || phone.slice(-6),
      customer_name: customer?.name || "WhatsApp Customer",
      total_paise: finalTotal,
      status: "pending",
      payment_status: "pending",
      delivery_status: "placed",
      delivery_date: deliveryISO,
      razorpay_order_id: rzpOrder.id,
      order_number: orderNumber,
    }).select().single();

    if (order) {
      await supabase.from("order_items").insert(
        cart.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          quantity: i.qty,
          unit_price_paise: i.price,
        }))
      );

      if (customer?.pincode) {
        const bakerId = await findBestBaker(supabase, customer.pincode);
        if (bakerId) {
          await supabase.from("orders").update({ baker_id: bakerId }).eq("id", order.id);
        }
      }
    }

    rzpLink = `${process.env.BASE_URL || ""}/pay/${rzpOrder.id}`;
  } catch (err) {
    console.error("Razorpay order error:", err);
  }

  await updateSession(phone, { step: "identify", cart: [] }, supabase);

  let msg = `Order *${orderNumber}* is placed! 🎉\nTotal: ₹${(finalTotal / 100).toFixed(0)}`;
  if (discountPercent > 0) msg += ` _(${discountPercent}% loyalty discount applied)_`;
  msg += `\nDelivery: ${formatISODate(deliveryISO)}`;
  if (rzpLink) msg += `\n\nPay here: ${rzpLink}\n\n_Link expires in 15 minutes._`;

  await send(phone, msg);
}

// ── Claude AI support fallback ────────────────────────────────────────────────
async function supportFallback(
  phone: string,
  text: string,
  session: Record<string, unknown>,
  supabase: ReturnType<typeof createServerSupabase>
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    await send(phone, "I didn't quite catch that. 🌾\n\nReply 1–5 to add a product, 0 to checkout, or CONFIRM to place your order.");
    return;
  }

  const temp = (session.temp as Record<string, unknown>) || {};
  const history = (temp.history as Array<{ role: string; content: string }>) || [];
  const recentMessages = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You are a warm, friendly customer support agent for Wild Wild Yeast (WWY), an artisanal sourdough and fermented goods brand in India. You help customers with product questions, delivery queries, ingredients, and order status. Keep responses concise and conversational. Never make up prices or delivery times — say you will check and follow up. Always end with an offer to help them order.",
      messages: [...recentMessages, { role: "user", content: text }],
    });

    const aiText = response.content[0].type === "text" ? response.content[0].text : "";

    const newHistory = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: aiText },
    ].slice(-10);
    await updateSession(phone, { temp: { ...temp, history: newHistory } }, supabase);

    await send(phone, aiText);
  } catch (err) {
    console.error("Claude AI error:", err);
    await send(phone, "I didn't quite catch that. 🌾\n\nReply 1–5 to add a product, 0 to checkout, or CONFIRM to place your order.");
  }
}

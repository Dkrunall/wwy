import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getRazorpay } from "@/lib/razorpay";
import { applyDiscounts } from "@/lib/discounts";
import { calculateDeliveryDate, deliveryDateISO, formatDeliveryDate, isValidDeliveryDate } from "@/lib/dateUtils";
import { CartItem } from "@/lib/supabase";
import { findBestBaker } from "@/lib/baker";

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `WWY-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { cart, customerId, flat, customerName, notes, deliveryDate: chosenDate } = (await req.json()) as {
      cart: CartItem[];
      customerId: string;
      flat: string;
      customerName: string;
      notes?: string;
      deliveryDate?: string;
    };

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Check vacation mode
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "vacation_mode")
      .single();
    if (setting?.value === "true") {
      return NextResponse.json({ error: "We are on a short break. Back soon! 🌾" }, { status: 503 });
    }

    // Resolve customer server-side by flat number — don't trust localStorage UUID
    const { data: customer } = await supabase
      .from("customers")
      .select("id, pincode")
      .eq("flat_number", flat)
      .single();
    const resolvedCustomerId = customer?.id ?? null;

    const baseTotalPaise = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
    const { finalTotal, discountPercent } = await applyDiscounts(resolvedCustomerId ?? "", baseTotalPaise);

    const deliveryDate = (chosenDate && isValidDeliveryDate(chosenDate))
      ? new Date(chosenDate + "T00:00:00Z")
      : calculateDeliveryDate();
    const deliveryISO = deliveryDateISO(deliveryDate);
    const deliveryLabel = formatDeliveryDate(deliveryDate);

    // Create Razorpay order
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: finalTotal,
      currency: "INR",
      notes: { customer_id: resolvedCustomerId ?? "", flat_number: flat },
    });

    const orderNumber = generateOrderNumber();

    // Save pending order to Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: resolvedCustomerId,
        flat_number: flat,
        customer_name: customerName,
        total_paise: finalTotal,
        notes: notes?.trim() || null,
        status: "pending",
        payment_status: "pending",
        delivery_status: "placed",
        delivery_date: deliveryISO,
        razorpay_order_id: rzpOrder.id,
        order_number: orderNumber,
        source: "web",
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Save order items
    const items = cart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_paise: i.unit_price_paise,
    }));
    await supabase.from("order_items").insert(items);

    // Auto-assign baker
    const bakerId = await findBestBaker(supabase, customer?.pincode);
    if (bakerId) {
      await supabase.from("orders").update({ baker_id: bakerId }).eq("id", order.id);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: finalTotal,
      keyId: process.env.RAZORPAY_KEY_ID,
      discountPercent,
      deliveryLabel,
    });
  } catch (err) {
    console.error("initiate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

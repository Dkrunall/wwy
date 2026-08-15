import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getRazorpay } from "@/lib/razorpay";
import { applyDiscounts } from "@/lib/discounts";
import { calculateShippingFee } from "@/lib/shipping";
import { calculateDeliveryDate, deliveryDateISO, formatDeliveryDate, isValidDeliveryDate, parseDeliveryDays } from "@/lib/dateUtils";
import { CartItem } from "@/lib/supabase";
import { isPincodeServiceable } from "@/lib/baker";

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `WWY-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { cart, flat, customerName, notes, deliveryDate: chosenDate } = (await req.json()) as {
      cart: CartItem[];
      flat: string;
      customerName: string;
      notes?: string;
      deliveryDate?: string;
    };

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch all relevant settings in one query
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["vacation_mode", "delivery_days", "cutoff_hour_ist"]);
    const settingsMap = Object.fromEntries((settingsRows || []).map((s) => [s.key, s.value]));

    if (settingsMap.vacation_mode === "true") {
      return NextResponse.json({ error: "We are on a short break. Back soon! 🌾" }, { status: 503 });
    }

    const deliveryDays = settingsMap.delivery_days ? parseDeliveryDays(settingsMap.delivery_days) : [3, 6];
    const cutoffHour = settingsMap.cutoff_hour_ist ? parseInt(settingsMap.cutoff_hour_ist, 10) : 12;

    // Resolve customer server-side by flat number — don't trust localStorage UUID
    const { data: customer } = await supabase
      .from("customers")
      .select("id, pincode")
      .eq("flat_number", flat)
      .single();
    const resolvedCustomerId = customer?.id ?? null;

    if (!(await isPincodeServiceable(supabase, customer?.pincode))) {
      return NextResponse.json(
        { error: "Sorry, we don't currently deliver to your pincode. Please update your address in your account." },
        { status: 400 }
      );
    }

    const baseTotalPaise = cart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
    const { finalTotal: finalGoodsPaise, discountPercent } = await applyDiscounts(resolvedCustomerId ?? "", baseTotalPaise);
    const shippingFeePaise = calculateShippingFee(baseTotalPaise);
    const finalTotal = finalGoodsPaise + shippingFeePaise;

    const deliveryDate = (chosenDate && isValidDeliveryDate(chosenDate, deliveryDays, cutoffHour))
      ? new Date(chosenDate + "T00:00:00Z")
      : calculateDeliveryDate(deliveryDays, cutoffHour);
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
        shipping_fee_paise: shippingFeePaise,
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

    // Baker assignment now happens from OMS after payment — see admin bulk-assign flow.

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: finalTotal,
      keyId: process.env.RAZORPAY_KEY_ID,
      discountPercent,
      shippingFeePaise,
      deliveryLabel,
    });
  } catch (err) {
    console.error("initiate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

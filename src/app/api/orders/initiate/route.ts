import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getRazorpay } from "@/lib/razorpay";
import { applyDiscounts } from "@/lib/discounts";
import { calculateShippingFee } from "@/lib/shipping";
import { resolveCoupon, redeemCoupon } from "@/lib/couponResolve";
import { calculateDeliveryDate, deliveryDateISO, formatDeliveryDate, isValidDeliveryDate, parseDeliveryDays } from "@/lib/dateUtils";
import { DEFAULT_CUTOFF_HOUR_IST, DEFAULT_DELIVERY_DAYS } from "@/lib/schedule";
import { CartItem } from "@/lib/supabase";
import { isPincodeServiceable } from "@/lib/baker";
import { getSessionCustomer } from "@/lib/customerSession";

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `WWY-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { cart, notes, deliveryDate: chosenDate, couponCode, skipAutoCoupon } = (await req.json()) as {
      cart: CartItem[];
      notes?: string;
      deliveryDate?: string;
      couponCode?: string;
      skipAutoCoupon?: boolean;
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

    const deliveryDays = settingsMap.delivery_days ? parseDeliveryDays(settingsMap.delivery_days) : DEFAULT_DELIVERY_DAYS;
    const cutoffHour = settingsMap.cutoff_hour_ist ? parseInt(settingsMap.cutoff_hour_ist, 10) : DEFAULT_CUTOFF_HOUR_IST;

    // The customer comes from the verified login session, never from the request body.
    const customer = await getSessionCustomer(req, supabase);
    if (!customer) {
      return NextResponse.json({ error: "Please sign in again to place your order." }, { status: 401 });
    }
    const resolvedCustomerId = customer.id;
    const flat = customer.flat_number;
    const customerName = customer.name;

    if (!(await isPincodeServiceable(supabase, customer.pincode))) {
      return NextResponse.json(
        { error: "Sorry, we don't currently deliver to your pincode. Please update your address in your account." },
        { status: 400 }
      );
    }

    // Never trust client prices: reprice every line from the products table.
    const productIds = [...new Set(cart.map((i) => i.product_id))];
    const { data: productRows } = await supabase
      .from("products")
      .select("id, name, price_paise, available")
      .in("id", productIds);
    const productMap = new Map((productRows || []).map((p) => [p.id as string, p]));

    const pricedCart: CartItem[] = [];
    for (const i of cart) {
      const product = productMap.get(i.product_id);
      if (!product || !product.available) {
        return NextResponse.json({ error: "An item in your cart is no longer available. Please refresh your cart." }, { status: 400 });
      }
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 100) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });
      }
      pricedCart.push({
        product_id: product.id,
        product_name: product.name,
        quantity: i.quantity,
        unit_price_paise: product.price_paise,
      });
    }

    const baseTotalPaise = pricedCart.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
    const { finalTotal: loyaltyFinalPaise, discountPercent } = await applyDiscounts(resolvedCustomerId, baseTotalPaise);
    const loyaltyDiscountPaise = baseTotalPaise - loyaltyFinalPaise;

    const { coupon, discountPaise: couponDiscountPaise, error: couponError } =
      await resolveCoupon(supabase, resolvedCustomerId, baseTotalPaise, couponCode, skipAutoCoupon);
    if (couponCode && couponCode.trim() && couponError) {
      return NextResponse.json({ error: couponError }, { status: 400 });
    }

    const totalDiscountPaise = Math.min(baseTotalPaise, loyaltyDiscountPaise + couponDiscountPaise);
    const finalGoodsPaise = baseTotalPaise - totalDiscountPaise;
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
      notes: { customer_id: resolvedCustomerId, flat_number: flat },
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
        coupon_code: coupon?.code ?? null,
        coupon_discount_paise: couponDiscountPaise,
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
    const items = pricedCart.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_paise: i.unit_price_paise,
    }));
    await supabase.from("order_items").insert(items);

    if (coupon) await redeemCoupon(supabase, coupon);

    // Baker assignment now happens from OMS after payment — see admin bulk-assign flow.

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: finalTotal,
      keyId: process.env.RAZORPAY_KEY_ID,
      discountPercent,
      shippingFeePaise,
      couponCode: coupon?.code ?? null,
      couponDiscountPaise,
      deliveryLabel,
    });
  } catch (err) {
    console.error("initiate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

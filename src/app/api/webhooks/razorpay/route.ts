import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendPaymentConfirmedToCustomer, sendOwnerNotification, sendNewOrderToBaker } from "@/lib/email";
import { generateInvoicePDF } from "@/lib/invoice";
import { findBestBaker } from "@/lib/baker";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload.payment.entity;
  const razorpayOrderId = payment.order_id;

  const supabase = createServerSupabase();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (!order || order.payment_status === "paid") {
    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      razorpay_payment_id: payment.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("flat_number", order.flat_number)
    .single();

  // Auto-assign baker if not already assigned
  if (!order.baker_id) {
    const bakerId = await findBestBaker(supabase, customer?.pincode);
    if (bakerId) {
      await supabase.from("orders").update({ baker_id: bakerId }).eq("id", order.id);
      const { data: baker } = await supabase.from("bakers").select("name, email, share_token").eq("id", bakerId).single();
      if (baker?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wildwildyeast.com";
        sendNewOrderToBaker(baker.email, baker.name, {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          flatNumber: order.flat_number,
          deliveryDate: order.delivery_date,
          items: order.order_items || [],
          notes: order.notes,
          dashboardUrl: `${appUrl}/baker/${baker.share_token}`,
        }).catch(console.error);
      }
    }
  }

  const itemsSubtotal = (order.order_items || []).reduce(
    (s: number, i: { quantity: number; unit_price_paise: number }) => s + i.quantity * i.unit_price_paise, 0
  );
  const discountPercent = itemsSubtotal > order.total_paise
    ? Math.round((1 - order.total_paise / itemsSubtotal) * 100)
    : 0;

  let invoiceUrl: string | undefined;
  try {
    const pdfBuffer = await generateInvoicePDF({
      order_number: order.order_number,
      customer_name: order.customer_name,
      flat_number: order.flat_number,
      address: customer?.address,
      phone: customer?.phone,
      items: order.order_items || [],
      total_paise: order.total_paise,
      discount_percent: discountPercent,
      delivery_date: order.delivery_date,
      created_at: order.created_at,
    });
    const fileName = `invoice_${order.order_number}.pdf`;
    await supabase.storage.from("invoices").upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
    invoiceUrl = urlData.publicUrl;
    await supabase.from("orders").update({ invoice_url: invoiceUrl }).eq("id", order.id);
  } catch (err) {
    console.error("Invoice error:", err);
  }

  if (customer?.email) {
    await sendPaymentConfirmedToCustomer(customer.email, order.customer_name, order.order_number, invoiceUrl).catch(console.error);
  }

  await sendOwnerNotification({
    order_number: order.order_number,
    customer_name: order.customer_name,
    flat_number: order.flat_number,
    total_paise: order.total_paise,
    delivery_date: order.delivery_date,
    items: order.order_items || [],
    notes: order.notes,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { generateInvoicePDF } from "@/lib/invoice";
import { sendPaymentConfirmedToCustomer, sendOwnerNotification } from "@/lib/email";
import { findBestBaker } from "@/lib/baker";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("oms_auth")?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const supabase = createServerSupabase();

    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.payment_status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

    await supabase.from("orders").update({
      payment_status: "paid",
      status: "confirmed",
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    const { data: customer } = await supabase
      .from("customers").select("*").eq("flat_number", order.flat_number).single();

    if (!order.baker_id && customer?.pincode) {
      const bakerId = await findBestBaker(supabase, customer.pincode);
      if (bakerId) await supabase.from("orders").update({ baker_id: bakerId }).eq("id", orderId);
    }

    const itemsSubtotal = (order.order_items || []).reduce(
      (s: number, i: { quantity: number; unit_price_paise: number }) => s + i.quantity * i.unit_price_paise, 0
    );
    const discountPercent = itemsSubtotal > order.total_paise
      ? Math.round((1 - order.total_paise / itemsSubtotal) * 100) : 0;

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
      await supabase.storage.from("invoices").upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });
      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
      invoiceUrl = urlData.publicUrl;
      await supabase.from("orders").update({ invoice_url: invoiceUrl }).eq("id", orderId);
    } catch (e) { console.error("Invoice gen failed:", e); }

    if (customer?.email) {
      await sendPaymentConfirmedToCustomer(customer.email, order.customer_name, order.order_number, invoiceUrl).catch(console.error);
    }
    await sendOwnerNotification({
      order_number: order.order_number, customer_name: order.customer_name,
      flat_number: order.flat_number, total_paise: order.total_paise,
      delivery_date: order.delivery_date, items: order.order_items || [], notes: order.notes,
    }).catch(console.error);

    return NextResponse.json({ ok: true, invoiceUrl });
  } catch (err) {
    console.error("mark-paid error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPaymentConfirmed } from "@/lib/whatsapp";
import { sendOwnerNotification } from "@/lib/email";
import { generateInvoicePDF } from "@/lib/invoice";
import { findBestBaker } from "@/lib/baker";

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Fetch order + items + customer
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Mark as paid
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Fetch customer phone
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("flat_number", order.flat_number)
      .single();

    // Auto-assign baker if not already assigned (pincode match preferred, any active baker as fallback)
    if (!order.baker_id) {
      const bakerId = await findBestBaker(supabase, customer?.pincode);
      if (bakerId) {
        await supabase.from("orders").update({ baker_id: bakerId }).eq("id", orderId);
      }
    }

    const itemsSubtotal = (order.order_items || []).reduce(
      (s: number, i: { quantity: number; unit_price_paise: number }) => s + i.quantity * i.unit_price_paise, 0
    );
    const discountPercent = itemsSubtotal > order.total_paise
      ? Math.round((1 - order.total_paise / itemsSubtotal) * 100)
      : 0;

    // Generate PDF invoice
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

      await supabase.from("orders").update({ invoice_url: invoiceUrl }).eq("id", orderId);
    } catch (invoiceErr) {
      console.error("Invoice generation failed:", invoiceErr);
    }

    // Send WhatsApp notification
    if (customer?.phone) {
      await sendPaymentConfirmed(
        customer.phone,
        order.customer_name,
        order.order_number,
        invoiceUrl
      ).catch(console.error);
    }

    // Email owner
    await sendOwnerNotification({
      order_number: order.order_number,
      customer_name: order.customer_name,
      flat_number: order.flat_number,
      total_paise: order.total_paise,
      delivery_date: order.delivery_date,
      items: order.order_items || [],
      notes: order.notes,
    }).catch(console.error);

    return NextResponse.json({ ok: true, orderId });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

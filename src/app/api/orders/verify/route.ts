import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendPaymentConfirmedToCustomer, sendOwnerNotification, sendNewOrderToBaker } from "@/lib/email";
import { createAdminNotification, createBakerNotification } from "@/lib/notifications";
import { generateInvoicePDF } from "@/lib/invoice";

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

    // Baker assignment now happens from OMS after payment — see admin bulk-assign flow.
    const assignedBakerId = order.baker_id;
    if (assignedBakerId) {
      const { data: baker } = await supabase.from("bakers").select("name, email, share_token").eq("id", assignedBakerId).single();
      if (baker) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wildwildyeast.com";
        if (baker.email) {
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
        createBakerNotification(
          supabase, assignedBakerId,
          `New Order — ${order.order_number}`,
          `${order.customer_name} · Flat ${order.flat_number}`
        ).catch(console.error);
      }
    }

    // Notify admin
    createAdminNotification(
      supabase,
      `New Order — ${order.order_number}`,
      `${order.customer_name} · Flat ${order.flat_number} · ₹${(order.total_paise / 100).toFixed(0)}`
    ).catch(console.error);

    const itemsSubtotal = (order.order_items || []).reduce(
      (s: number, i: { quantity: number; unit_price_paise: number }) => s + i.quantity * i.unit_price_paise, 0
    );
    const shippingFeePaise = order.shipping_fee_paise || 0;
    const goodsTotal = order.total_paise - shippingFeePaise;
    const discountPercent = itemsSubtotal > goodsTotal
      ? Math.round((1 - goodsTotal / itemsSubtotal) * 100)
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
        shipping_fee_paise: shippingFeePaise,
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

    if (customer?.email) {
      await sendPaymentConfirmedToCustomer(customer.email, order.customer_name, order.order_number, invoiceUrl).catch(console.error);
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

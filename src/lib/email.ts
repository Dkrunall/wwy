import nodemailer from "nodemailer";

interface OrderEmailData {
  order_number: string;
  customer_name: string;
  flat_number: string;
  total_paise: number;
  delivery_date?: string;
  items: { product_name: string; quantity: number; unit_price_paise: number }[];
  notes?: string;
  baker_name?: string;
}

export async function sendOwnerNotification(order: OrderEmailData): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.OWNER_EMAIL) return;

  const total = (order.total_paise / 100).toFixed(0);
  const itemRows = order.items
    .map(
      (i) =>
        `<tr style="border-bottom:1px solid #eee">
           <td style="padding:8px">${i.product_name}</td>
           <td style="padding:8px;text-align:center">${i.quantity}</td>
           <td style="padding:8px;text-align:right">₹${(i.unit_price_paise / 100).toFixed(0)}</td>
           <td style="padding:8px;text-align:right">₹${((i.quantity * i.unit_price_paise) / 100).toFixed(0)}</td>
         </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#2c1a0e">
      <h2 style="color:#c9a96e">🌾 New Order — Wild Wild Yeast</h2>
      <p><b>Order:</b> ${order.order_number}</p>
      <p><b>Customer:</b> ${order.customer_name} · Flat ${order.flat_number}</p>
      ${order.delivery_date ? `<p><b>Delivery Date:</b> ${order.delivery_date}</p>` : ""}
      ${order.baker_name ? `<p><b>Assigned Baker:</b> ${order.baker_name}</p>` : ""}
      <table width="100%" style="border-collapse:collapse;margin-top:12px">
        <thead>
          <tr style="background:#f5f0ea">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px">Qty</th>
            <th style="padding:8px;text-align:right">Unit</th>
            <th style="padding:8px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px;font-weight:bold">Grand Total</td>
            <td style="padding:10px;text-align:right;font-weight:bold;color:#2e7d32">₹${total}</td>
          </tr>
        </tfoot>
      </table>
      ${order.notes ? `<p style="margin-top:12px;font-style:italic">Note: ${order.notes}</p>` : ""}
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.OWNER_EMAIL,
    subject: `New Order ${order.order_number} — ₹${total} — ${order.customer_name}`,
    html,
  });
}

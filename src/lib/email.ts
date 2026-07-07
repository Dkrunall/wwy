import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

function fmt(paise: number) { return `₹${(paise / 100).toFixed(0)}`; }

export async function sendPaymentConfirmedToCustomer(
  email: string,
  name: string,
  orderNumber: string,
  invoiceUrl?: string
): Promise<void> {
  if (!process.env.GMAIL_USER || !email) return;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2c1a0e">
      <h2 style="color:#c9a96e;margin-bottom:4px">Payment Confirmed ✅</h2>
      <p style="margin-top:0;color:#888;font-size:13px">Wild Wild Yeast</p>
      <p>Hi <b>${name}</b>, your payment is confirmed.</p>
      <p style="font-size:20px;font-weight:900;color:#2c1a0e">Order ${orderNumber}</p>
      <p>Your bread is confirmed and baking will begin soon. 🍞<br/>We'll send you another email when your order is out for delivery.</p>
      ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="background:#2c1a0e;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;margin-top:8px">Download Invoice →</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#aaa">Wild Wild Yeast · Handcrafted with love 🌾</p>
    </div>`;
  await createTransporter().sendMail({
    from: `Wild Wild Yeast <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `✅ Order Confirmed — ${orderNumber}`,
    html,
  });
}

export async function sendDeliveryUpdateToCustomer(
  email: string,
  name: string,
  orderNumber: string,
  status: string
): Promise<void> {
  if (!process.env.GMAIL_USER || !email) return;

  const updates: Record<string, { subject: string; headline: string; body: string }> = {
    mixing: {
      subject: `🫙 Your dough is being mixed — ${orderNumber}`,
      headline: "Mixing has begun",
      body: `It's started! <b>${name}</b>, your baker has begun mixing the dough for your order. 🫙 Wild fermentation in progress.`,
    },
    stretching: {
      subject: `🤲 Stretch & fold in progress — ${orderNumber}`,
      headline: "Stretch & fold",
      body: `Your dough is being stretched and folded, <b>${name}</b>! 🤲 This is where the structure and chew develops. Good things take time.`,
    },
    resting: {
      subject: `🌅 Your dough is bulk-resting — ${orderNumber}`,
      headline: "Dough is resting",
      body: `Your sourdough dough is now resting and developing flavour, <b>${name}</b>. The magic happens when we slow down. 🌙`,
    },
    cold_proof: {
      subject: `❄️ Into the fridge — ${orderNumber}`,
      headline: "Cold proofing",
      body: `Your dough has gone into the fridge for a slow cold proof, <b>${name}</b>. ❄️ This is what gives our bread its signature tang.`,
    },
    baking: {
      subject: `🔥 Into the oven — ${orderNumber}`,
      headline: "Baking now",
      body: `Into the oven it goes! 🔥 Your bread is baking right now, <b>${name}</b>. Won't be long.`,
    },
    out_for_delivery: {
      subject: `🚗 Your order is on the way — ${orderNumber}`,
      headline: "Out for delivery",
      body: `Your order is on its way, <b>${name}</b>! 🚗 Expected within 2 hours. Please be available to receive it.`,
    },
    delivered: {
      subject: `🎉 Delivered! — ${orderNumber}`,
      headline: "Delivered",
      body: `Your order has been delivered, <b>${name}</b>! 🎉<br/><br/>Enjoy every bite. We'd love your feedback — just reply to this email with your thoughts.`,
    },
  };

  const update = updates[status];
  if (!update) return;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2c1a0e">
      <h2 style="color:#c9a96e;margin-bottom:4px">${update.headline}</h2>
      <p style="margin-top:0;color:#888;font-size:13px">Order ${orderNumber} · Wild Wild Yeast</p>
      <p>${update.body}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#aaa">Wild Wild Yeast · Handcrafted with love 🌾</p>
    </div>`;

  await createTransporter().sendMail({
    from: `Wild Wild Yeast <${process.env.GMAIL_USER}>`,
    to: email,
    subject: update.subject,
    html,
  });
}

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

  await createTransporter().sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.OWNER_EMAIL,
    subject: `New Order ${order.order_number} — ₹${total} — ${order.customer_name}`,
    html,
  });
}

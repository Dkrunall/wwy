const BASE = `https://graph.facebook.com/v18.0`;

function fmt(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

async function send(to: string, message: string): Promise<void> {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return;
  const phone = to.replace(/\D/g, "");
  const normalized = phone.startsWith("91") ? phone : `91${phone}`;
  await fetch(`${BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalized,
      type: "text",
      text: { body: message },
    }),
  });
}

export async function sendOrderPlaced(
  phone: string,
  name: string,
  orderNumber: string,
  totalPaise: number,
  deliveryDate: string
): Promise<void> {
  await send(
    phone,
    `Hi ${name}! 🌾 Your order *${orderNumber}* has been received.\n\nTotal: *${fmt(totalPaise)}*\nDelivery: ${deliveryDate}\n\nComplete payment to confirm your order. Thank you for choosing Wild Wild Yeast!`
  );
}

export async function sendPaymentConfirmed(
  phone: string,
  name: string,
  orderNumber: string,
  invoiceUrl?: string
): Promise<void> {
  let msg = `Payment received! ✅ Thank you *${name}*.\n\nOrder *${orderNumber}* is confirmed. Baking begins soon. 🍞\n\nWe'll keep you updated on delivery day. 🌾`;
  if (invoiceUrl) msg += `\n\nDownload your invoice: ${invoiceUrl}`;
  await send(phone, msg);
}

export async function sendDeliveryUpdate(
  phone: string,
  name: string,
  orderNumber: string,
  status: string
): Promise<void> {
  const messages: Record<string, string> = {
    resting: `Good morning *${name}*! 🌅 Your sourdough dough is resting and developing flavour.\nOrder: *${orderNumber}*`,
    baking: `Into the oven it goes! 🔥 Your bread is baking right now.\nOrder: *${orderNumber}*`,
    out_for_delivery: `Your order is on its way! 🚗 Order: *${orderNumber}*\nExpected within 2 hours. Contact your baker if needed.`,
    delivered: `Delivered! 🎉 Enjoy your order, *${name}*!\n\nWe'd love your feedback — just reply with your thoughts. See you next time. 🌾`,
  };
  const msg = messages[status];
  if (msg) await send(phone, msg);
}

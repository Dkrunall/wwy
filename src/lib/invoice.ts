// eslint-disable-next-line @typescript-eslint/no-require-imports
const _pdfkit = require("pdfkit");
import path from "path";
// Turbopack may wrap CJS default export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument: any = typeof _pdfkit === "function" ? _pdfkit : (_pdfkit.default ?? _pdfkit);

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price_paise: number;
}

interface InvoiceData {
  order_number: string;
  customer_name: string;
  flat_number: string;
  address?: string | null;
  phone?: string | null;
  items: InvoiceItem[];
  total_paise: number;
  shipping_fee_paise?: number;
  coupon_code?: string | null;
  coupon_discount_paise?: number;
  discount_percent?: number;
  delivery_date?: string | null;
  created_at: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // A4 size page dimensions are 595.28 x 841.89 points
    const doc = new PDFDocument({ margin: 50, size: "A4" }) as any;
    const chunks: Buffer[] = [];

    doc.on("data", (chunk?: Buffer) => { if (chunk) chunks.push(chunk); });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ─── VERTICAL ASYMMETRIC TWIN-BAR GRID (Left margin) ─────────────────────
    doc.strokeColor("#923D26").lineWidth(1.5).moveTo(32, 50).lineTo(32, 790).stroke();
    doc.strokeColor("#EADBC8").lineWidth(0.5).moveTo(36, 50).lineTo(36, 790).stroke();

    // ─── HEADER SECTION ──────────────────────────────────────────────────────
    doc.fillColor("#923D26");
    doc.font("Times-Bold").fontSize(26).text("Wild Wild Yeast", 50, 50);
    
    doc.fillColor("#E89936");
    doc.font("Helvetica-Bold").fontSize(8.5).text("NATURAL SODAS & SOURDOUGH · BAKED WITH WILD FERMENTATION", 50, 80);
    
    doc.fillColor("#8C7665");
    doc.font("Helvetica").fontSize(9.5).text("Handcrafted Daily · Sourced from Local Sourdough Cultures", 50, 94);

    // Brand Logo in top right
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      doc.image(logoPath, 465, 45, { width: 80 });
    } catch (e) {
      console.error("Could not load invoice logo:", e);
    }

    // Subtle brand rule line
    doc.strokeColor("#E6D7C8").lineWidth(0.75).moveTo(50, 112).lineTo(545, 112).stroke();

    // ─── BENTO-STYLE METADATA DETAILS CARDS ──────────────────────────────────
    
    // Left Bento Card: Invoice Info
    doc.strokeColor("#EADBC8").lineWidth(0.75).roundedRect(50, 125, 235, 92, 8).stroke();
    doc.fillColor("#FFFDFB").roundedRect(50.37, 125.37, 234.25, 91.25, 8).fill();
    
    doc.fillColor("#E89936");
    doc.font("Helvetica-Bold").fontSize(7.5).text("INVOICE METADATA", 65, 138);
    
    doc.fillColor("#923D26");
    doc.font("Times-Bold").fontSize(11).text(data.order_number, 65, 151);
    
    const dateStr = new Date(data.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    
    doc.fillColor("#5C4A3C");
    doc.font("Helvetica-Bold").fontSize(8).text("DATE ISSUED", 65, 170);
    doc.font("Helvetica").fontSize(9.5).text(dateStr, 65, 180);
    
    if (data.delivery_date) {
      doc.fillColor("#E89936");
      doc.font("Helvetica-Bold").fontSize(8).text("DELIVERY DATE", 165, 170);
      doc.font("Helvetica").fontSize(9.5).text(data.delivery_date, 165, 180);
    }

    // Right Bento Card: Billing Info
    doc.strokeColor("#EADBC8").lineWidth(0.75).roundedRect(300, 125, 245, 92, 8).stroke();
    doc.fillColor("#FFFDFB").roundedRect(300.37, 125.37, 244.25, 91.25, 8).fill();
    
    doc.fillColor("#E89936");
    doc.font("Helvetica-Bold").fontSize(7.5).text("BILL TO CUSTOMER", 315, 138);
    
    doc.fillColor("#923D26");
    doc.font("Times-Bold").fontSize(11).text(data.customer_name, 315, 151);
    
    doc.fillColor("#5C4A3C");
    doc.font("Helvetica-Bold").fontSize(8).text("FLAT / APT", 315, 170);
    doc.font("Helvetica").fontSize(9.5).text(`Flat ${data.flat_number}`, 315, 180);
    
    if (data.phone) {
      doc.fillColor("#5C4A3C");
      doc.font("Helvetica-Bold").fontSize(8).text("PHONE", 420, 170);
      doc.font("Helvetica").fontSize(9.5).text(data.phone, 420, 180);
    }
    if (data.address) {
      doc.fillColor("#8C7665");
      doc.font("Helvetica").fontSize(8).text(data.address, 315, 196, { width: 220, height: 16, ellipsis: true });
    }

    // ─── LEDGER PRODUCT TABLE ────────────────────────────────────────────────
    const tableTop = 240;
    
    // Header Row Container
    doc.fillColor("#923D26").rect(50, tableTop, 495, 26).fill();
    doc.fillColor("#E89936").rect(50, tableTop + 26, 495, 2).fill();
    
    doc.fillColor("#FFFFFF");
    doc.font("Helvetica-Bold").fontSize(8.5);
    doc.text("NO.", 65, tableTop + 9);
    doc.text("ITEM DESCRIPTION", 90, tableTop + 9);
    doc.text("QTY", 330, tableTop + 9, { width: 30, align: "center" });
    doc.text("UNIT PRICE", 370, tableTop + 9, { width: 80, align: "right" });
    doc.text("TOTAL", 465, tableTop + 9, { width: 80, align: "right" });
    
    let y = tableTop + 36;
    let idx = 0;
    
    for (const item of data.items) {
      const lineTotal = item.quantity * item.unit_price_paise;
      
      // Light background for alternating rows
      doc.fillColor(idx % 2 === 0 ? "#FFFDF9" : "#FCF8F2").roundedRect(50, y - 4, 495, 24, 4).fill();
      
      // Number index
      doc.fillColor("#E89936");
      doc.font("Helvetica-Bold").fontSize(8.5).text(String(idx + 1).padStart(2, "0"), 65, y + 3);
      
      // Product Name
      doc.fillColor("#923D26");
      doc.font("Times-Bold").fontSize(10.5).text(item.product_name, 90, y + 3);
      
      // Numbers
      doc.fillColor("#5C4A3C");
      doc.font("Helvetica").fontSize(9.5);
      doc.text(String(item.quantity), 330, y + 3, { width: 30, align: "center" });
      doc.text(`Rs.${(item.unit_price_paise / 100).toFixed(0)}`, 370, y + 3, { width: 80, align: "right" });
      
      doc.fillColor("#923D26");
      doc.font("Helvetica-Bold").fontSize(10).text(`Rs.${(lineTotal / 100).toFixed(0)}`, 465, y + 3, { width: 80, align: "right" });
      
      // Underline border
      doc.strokeColor("#EADBC8").lineWidth(0.5).moveTo(50, y + 20).lineTo(545, y + 20).stroke();
      
      y += 28;
      idx++;
    }
    
    y += 10;

    // ─── TOTALS SECTION ──────────────────────────────────────────────────────
    const totalsX = 330;
    const totalsWidth = 215;

    const shippingFeePaise = data.shipping_fee_paise || 0;
    const couponDiscountPaise = data.coupon_discount_paise || 0;
    const goodsTotal = data.total_paise - shippingFeePaise;
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unit_price_paise, 0);
    const hasLoyaltyDiscount = !!data.discount_percent && data.discount_percent > 0;
    const hasCoupon = couponDiscountPaise > 0;
    const loyaltyDiscountPaise = Math.max(0, subtotal - goodsTotal - couponDiscountPaise);

    if (hasLoyaltyDiscount || hasCoupon) {
      doc.fillColor("#5C4A3C");
      doc.font("Helvetica").fontSize(9);
      doc.text(`Subtotal: Rs.${(subtotal / 100).toFixed(0)}`, totalsX, y, { width: totalsWidth, align: "right" });
      y += 16;

      if (hasLoyaltyDiscount) {
        doc.fillColor("#E89936");
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text(
          `Loyalty Discount (${data.discount_percent}%): -Rs.${(loyaltyDiscountPaise / 100).toFixed(0)}`,
          totalsX,
          y,
          { width: totalsWidth, align: "right" }
        );
        y += 16;
      }

      if (hasCoupon) {
        doc.fillColor("#E89936");
        doc.font("Helvetica-Bold").fontSize(9);
        doc.text(
          `Coupon (${data.coupon_code || "—"}): -Rs.${(couponDiscountPaise / 100).toFixed(0)}`,
          totalsX,
          y,
          { width: totalsWidth, align: "right" }
        );
        y += 16;
      }
    }

    doc.fillColor("#5C4A3C");
    doc.font("Helvetica").fontSize(9);
    doc.text(
      shippingFeePaise > 0 ? `Shipping: Rs.${(shippingFeePaise / 100).toFixed(0)}` : "Shipping: FREE",
      totalsX,
      y,
      { width: totalsWidth, align: "right" }
    );
    y += 20;

    // Grand Total Capsule
    doc.strokeColor("#E89936").lineWidth(1).roundedRect(325, y - 4, 220, 32, 6).stroke();
    doc.fillColor("#FFFDFB").roundedRect(325.5, y - 3.5, 219, 31, 6).fill();
    
    doc.fillColor("#923D26");
    doc.font("Times-Bold").fontSize(12).text(
      `Grand Total: Rs.${(data.total_paise / 100).toFixed(0)}`,
      335,
      y + 7,
      { width: 200, align: "right" }
    );

    // ─── ARTISAN STORAGE & CARE INSTRUCTIONS BENTO ───────────────────────────
    const careTop = 635;
    doc.strokeColor("#EADBC8").lineWidth(0.75).roundedRect(50, careTop, 495, 80, 8).stroke();
    doc.fillColor("#FFFDFB").roundedRect(50.37, careTop + 0.37, 494.25, 79.25, 8).fill();
    
    doc.fillColor("#E89936");
    doc.font("Helvetica-Bold").fontSize(7.5).text("ARTISAN SOURDOUGH STORAGE & CARE", 65, careTop + 12);
    
    doc.fillColor("#5C4A3C");
    doc.font("Helvetica").fontSize(8.5);
    doc.text(
      "· Storage: Sourdough is alive! Keep in a paper bag or freeze for up to 3 months. NEVER refrigerate naturally fermented bread as it stales the crumb.",
      65,
      careTop + 26,
      { width: 220, lineGap: 2.5 }
    );
    doc.text(
      "· Reheating: Slice and toast lightly, or bake the whole loaf at 200°C for 8 minutes to restore the crackly, wild crust and open, steamy interior.",
      305,
      careTop + 26,
      { width: 220, lineGap: 2.5 }
    );

    // ─── ARTISAN BRAND FOOTER ────────────────────────────────────────────────
    const footerY = 745;
    
    // Ornamental thin gold line
    doc.strokeColor("#E89936").lineWidth(0.5).moveTo(240, footerY - 14).lineTo(355, footerY - 14).stroke();
    
    doc.fillColor("#8C7665");
    doc.font("Times-Italic").fontSize(9.5).text(
      "Thank you for supporting artisan baking.",
      50,
      footerY,
      { align: "center", width: 495 }
    );
    
    doc.fillColor("#923D26");
    doc.font("Helvetica-Bold").fontSize(7.5).text(
      "WILD WILD YEAST · SOURDOUGH & NATURAL FERMENTS",
      50,
      footerY + 16,
      { align: "center", width: 495 }
    );

    doc.end();
  });
}



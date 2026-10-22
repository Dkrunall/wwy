// eslint-disable-next-line @typescript-eslint/no-require-imports
const _pdfkit = require("pdfkit");
import path from "path";
// Turbopack may wrap CJS default export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument: any = typeof _pdfkit === "function" ? _pdfkit : (_pdfkit.default ?? _pdfkit);

const GSTIN = "27ABFFB6655G1ZB";
// Seller is in Maharashtra and delivers locally, so every sale is intra-state (CGST + SGST)
const PLACE_OF_SUPPLY = "Maharashtra (27)";

interface InvoiceItem {
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
  hsn_code?: string | null;
  gst_rate?: number | null;
}

// Attach each item's current HSN code + GST rate from the products table.
// Never throws: if the lookup fails (e.g. migration not yet run) items go out at 0% GST.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withTaxInfo<T extends InvoiceItem>(supabase: any, items: T[]): Promise<T[]> {
  const ids = [...new Set(items.map(i => i.product_id).filter(Boolean))];
  if (ids.length === 0) return items;
  const { data, error } = await supabase.from("products").select("id, hsn_code, gst_rate").in("id", ids);
  if (error || !data) {
    console.error("Could not load GST info for invoice:", error);
    return items;
  }
  const byId = new Map<string, { hsn_code: string | null; gst_rate: number | null }>(
    data.map((p: { id: string; hsn_code: string | null; gst_rate: number | null }) => [p.id, p])
  );
  return items.map(i => {
    const p = i.product_id ? byId.get(i.product_id) : undefined;
    return p ? { ...i, hsn_code: p.hsn_code, gst_rate: Number(p.gst_rate) || 0 } : i;
  });
}

const rs2 = (paise: number) => `Rs.${(paise / 100).toFixed(2)}`;

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
      const logoPath = path.join(process.cwd(), "public", "WWY-LOGO_White.png");
      doc.image(logoPath, 465, 45, { width: 80 });
    } catch (e) {
      console.error("Could not load invoice logo:", e);
    }

    // Subtle brand rule line
    doc.strokeColor("#E6D7C8").lineWidth(0.75).moveTo(50, 112).lineTo(545, 112).stroke();

    // ─── BENTO-STYLE METADATA DETAILS CARDS ──────────────────────────────────
    
    // Left Bento Card: Invoice Info
    doc.strokeColor("#EADBC8").lineWidth(0.75).roundedRect(50, 125, 235, 104, 8).stroke();
    doc.fillColor("#FFFDFB").roundedRect(50.37, 125.37, 234.25, 103.25, 8).fill();
    
    doc.fillColor("#E89936");
    doc.font("Helvetica-Bold").fontSize(7.5).text("TAX INVOICE", 65, 138);
    
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

    doc.fillColor("#5C4A3C");
    doc.font("Helvetica-Bold").fontSize(8).text("GSTIN", 65, 198);
    doc.font("Helvetica").fontSize(9.5).text(GSTIN, 140, 197);
    doc.font("Helvetica-Bold").fontSize(8).text("PLACE OF SUPPLY", 65, 212);
    doc.font("Helvetica").fontSize(9.5).text(PLACE_OF_SUPPLY, 140, 211);

    // Right Bento Card: Billing Info
    doc.strokeColor("#EADBC8").lineWidth(0.75).roundedRect(300, 125, 245, 104, 8).stroke();
    doc.fillColor("#FFFDFB").roundedRect(300.37, 125.37, 244.25, 103.25, 8).fill();
    
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
    const tableTop = 250;
    
    // Header Row Container
    doc.fillColor("#923D26").rect(50, tableTop, 495, 26).fill();
    doc.fillColor("#E89936").rect(50, tableTop + 26, 495, 2).fill();
    
    doc.fillColor("#FFFFFF");
    doc.font("Helvetica-Bold").fontSize(8.5);
    doc.text("NO.", 65, tableTop + 9);
    doc.text("ITEM DESCRIPTION", 90, tableTop + 9);
    doc.text("HSN", 265, tableTop + 9, { width: 45, align: "center" });
    doc.text("GST", 312, tableTop + 9, { width: 36, align: "center" });
    doc.text("QTY", 350, tableTop + 9, { width: 30, align: "center" });
    doc.text("UNIT PRICE", 382, tableTop + 9, { width: 75, align: "right" });
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
      doc.font("Times-Bold").fontSize(10.5).text(item.product_name, 90, y + 3, { width: 170, height: 14, ellipsis: true });
      
      // Numbers
      doc.fillColor("#5C4A3C");
      doc.font("Helvetica").fontSize(9.5);
      doc.text(item.hsn_code || "-", 265, y + 3, { width: 45, align: "center" });
      doc.text(`${Number(item.gst_rate) || 0}%`, 312, y + 3, { width: 36, align: "center" });
      doc.text(String(item.quantity), 350, y + 3, { width: 30, align: "center" });
      doc.text(`Rs.${(item.unit_price_paise / 100).toFixed(0)}`, 382, y + 3, { width: 75, align: "right" });
      
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
    const sectionTop = y;

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

    // ─── GST SUMMARY (left column, beside totals) ────────────────────────────
    // Prices are GST-inclusive. Spread loyalty + coupon discounts across lines pro rata,
    // tax shipping at the highest item rate (it's part of the same composite supply),
    // then back the tax out of each rate bucket.
    const totalDiscount = Math.max(0, subtotal - goodsTotal);
    const byRate = new Map<number, number>();
    for (const item of data.items) {
      const gross = item.quantity * item.unit_price_paise;
      const net = subtotal > 0 ? gross - (totalDiscount * gross) / subtotal : 0;
      const rate = Number(item.gst_rate) || 0;
      byRate.set(rate, (byRate.get(rate) || 0) + net);
    }
    if (shippingFeePaise > 0) {
      const shipRate = Math.max(0, ...data.items.map(i => Number(i.gst_rate) || 0));
      byRate.set(shipRate, (byRate.get(shipRate) || 0) + shippingFeePaise);
    }
    // Round each bucket, then push any leftover paisa onto the largest so the summary adds up to the grand total
    const buckets = [...byRate.entries()].map(([rate, amount]) => ({ rate, inclusive: Math.round(amount) }));
    const residue = data.total_paise - buckets.reduce((s, b) => s + b.inclusive, 0);
    if (buckets.length > 0 && Math.abs(residue) <= buckets.length) {
      buckets.reduce((max, b) => (b.inclusive > max.inclusive ? b : max)).inclusive += residue;
    }
    const taxRows = buckets.sort((a, b) => a.rate - b.rate).map(({ rate, inclusive }) => {
      const taxable = Math.round((inclusive * 100) / (100 + rate));
      const tax = inclusive - taxable;
      const cgst = Math.round(tax / 2);
      return { rate, taxable, cgst, sgst: tax - cgst };
    });

    const sumX = 50, sumW = 260;
    const cols = [
      { label: "GST RATE", x: sumX + 8, w: 62, align: "left" as const },
      { label: "TAXABLE", x: sumX + 70, w: 64, align: "right" as const },
      { label: "CGST", x: sumX + 134, w: 58, align: "right" as const },
      { label: "SGST", x: sumX + 192, w: 60, align: "right" as const },
    ];
    let ty = sectionTop;
    doc.fillColor("#E89936").font("Helvetica-Bold").fontSize(7.5).text("GST SUMMARY", sumX, ty);
    ty += 13;
    doc.fillColor("#FCF8F2").roundedRect(sumX, ty - 3, sumW, 15, 3).fill();
    doc.fillColor("#923D26").font("Helvetica-Bold").fontSize(7);
    for (const c of cols) doc.text(c.label, c.x, ty + 1, { width: c.w, align: c.align });
    ty += 16;
    const drawTaxRow = (cells: string[], bold: boolean) => {
      doc.fillColor(bold ? "#923D26" : "#5C4A3C").font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
      cells.forEach((v, i) => doc.text(v, cols[i].x, ty, { width: cols[i].w, align: cols[i].align }));
      ty += 13;
    };
    for (const t of taxRows) {
      drawTaxRow([`${t.rate}%`, rs2(t.taxable), rs2(t.cgst), rs2(t.sgst)], false);
    }
    doc.strokeColor("#EADBC8").lineWidth(0.5).moveTo(sumX, ty - 2).lineTo(sumX + sumW, ty - 2).stroke();
    ty += 2;
    drawTaxRow([
      "Total",
      rs2(taxRows.reduce((s, t) => s + t.taxable, 0)),
      rs2(taxRows.reduce((s, t) => s + t.cgst, 0)),
      rs2(taxRows.reduce((s, t) => s + t.sgst, 0)),
    ], true);
    doc.fillColor("#8C7665").font("Helvetica-Oblique").fontSize(7).text("All prices are inclusive of GST.", sumX, ty + 2);

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
      `WILD WILD YEAST · SOURDOUGH & NATURAL FERMENTS · GSTIN ${GSTIN}`,
      50,
      footerY + 16,
      { align: "center", width: 495 }
    );

    doc.end();
  });
}



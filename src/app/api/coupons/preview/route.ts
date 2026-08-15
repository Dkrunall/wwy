import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { resolveCoupon } from "@/lib/couponResolve";

// Used by the cart page to preview an auto-apply coupon (no code) or
// validate a manually-typed code, before checkout locks it in server-side
// again in /api/orders/initiate. Never used to compute the charged amount.
export async function POST(req: NextRequest) {
  try {
    const { customerId, subtotalPaise, code } = (await req.json()) as {
      customerId?: string | null;
      subtotalPaise?: number;
      code?: string;
    };

    if (typeof subtotalPaise !== "number" || subtotalPaise < 0) {
      return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { coupon, discountPaise, error } = await resolveCoupon(supabase, customerId || null, subtotalPaise, code);

    if (error) return NextResponse.json({ error }, { status: 400 });

    return NextResponse.json({
      coupon: coupon
        ? {
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
          }
        : null,
      discountPaise,
    });
  } catch (err) {
    console.error("coupon preview error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

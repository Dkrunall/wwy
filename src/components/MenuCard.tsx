"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import VegMark from "@/components/VegMark";
import { dietOf, DIET_LABEL } from "@/lib/diet";
import { LIMIT_HINT } from "@/lib/orderLimits";
import type { Product } from "@/lib/products";
import type { useCart } from "@/lib/useCart";

// One product card for every menu on the site (homepage and /shop).
export default function MenuCard({ product, bakeDays, cart }: { product: Product; bakeDays?: string; cart: ReturnType<typeof useCart> }) {
  const router = useRouter();
  const d = product.declarations;
  const diet = dietOf(d?.ingredients, d?.allergens);
  const qty = cart.qtyOf(product);
  const canAdd = cart.canAdd(product);
  const orderable = !!product.dbId;

  const buyNow = () => {
    if (qty === 0) cart.add(product);
    router.push("/order/cart");
  };

  return (
    <article className="group flex flex-col bg-white rounded-[1.25rem] sm:rounded-[1.75rem] overflow-hidden border border-brand-brown/8 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className={`relative w-full aspect-square ${product.bgColor}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 sm:p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 max-w-[70%] truncate text-[11px] font-black bg-brand-brown text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.badge}
          </span>
        )}
        {diet && <VegMark diet={diet} className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5" />}
      </div>

      <div className="flex flex-col flex-1 p-3.5 sm:p-5 gap-1.5">
        <h3 className="font-serif font-normal text-base sm:text-xl leading-snug tracking-tight text-brand-brown">{product.name}</h3>
        {bakeDays && <p className="text-[11px] font-black tracking-[0.12em] uppercase text-brand-orange">Baked for {bakeDays}</p>}
        {product.desc && <p className="hidden sm:block text-sm font-medium text-brand-brown/70 leading-relaxed line-clamp-2">{product.desc}</p>}
        {d?.allergens && <p className="text-[11px] sm:text-xs font-bold text-brand-brown/70 leading-snug">Contains: {d.allergens}</p>}

        <details className="text-xs font-medium text-brand-brown/75">
          <summary className="cursor-pointer list-none block py-2 text-[11px] font-black tracking-[0.15em] uppercase text-brand-brown/70 hover:text-brand-orange">
            Ingredients & details
          </summary>
          <dl className="pb-2 flex flex-col gap-1.5 leading-relaxed">
            <div><dt className="inline font-black text-brand-brown">MRP: </dt><dd className="inline">{product.price} (incl. all taxes)</dd></div>
            {diet && <div><dt className="inline font-black text-brand-brown">Type: </dt><dd className="inline">{DIET_LABEL[diet]}</dd></div>}
            {d?.ingredients && <div><dt className="inline font-black text-brand-brown">Ingredients: </dt><dd className="inline">{d.ingredients}</dd></div>}
            {d?.netQuantity && <div><dt className="inline font-black text-brand-brown">Net quantity: </dt><dd className="inline">{d.netQuantity}</dd></div>}
            {d?.bestBefore && <div><dt className="inline font-black text-brand-brown">Best before: </dt><dd className="inline">{d.bestBefore}</dd></div>}
            {d?.storage && <div><dt className="inline font-black text-brand-brown">Storage: </dt><dd className="inline">{d.storage}</dd></div>}
            {d?.manufacturer && (
              <div><dt className="inline font-black text-brand-brown">Manufactured by: </dt><dd className="inline">{d.manufacturer.name}, {d.manufacturer.address}. FSSAI {d.manufacturer.fssai}</dd></div>
            )}
          </dl>
        </details>

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <span className="font-black text-brand-orange text-base sm:text-lg">{product.price}</span>
          {orderable ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {qty === 0 ? (
                <button
                  onClick={() => cart.add(product)}
                  disabled={!canAdd}
                  className="h-10 rounded-full text-[11px] font-black tracking-[0.12em] uppercase border border-brand-brown/25 text-brand-brown hover:border-brand-brown active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add to cart
                </button>
              ) : (
                <div className="h-10 flex items-center justify-between rounded-full border border-brand-brown/25 px-1">
                  <button onClick={() => cart.remove(product)} aria-label={`Remove one ${product.name}`} className="w-8 h-8 rounded-full font-black text-brand-brown hover:bg-brand-oat">−</button>
                  <span className="text-sm font-black text-brand-brown" aria-live="polite">{qty}</span>
                  <button onClick={() => cart.add(product)} disabled={!canAdd} aria-label={`Add one ${product.name}`} className="w-8 h-8 rounded-full font-black text-brand-brown hover:bg-brand-oat disabled:opacity-40 disabled:cursor-not-allowed">+</button>
                </div>
              )}
              <button
                onClick={buyNow}
                className="h-10 rounded-full text-[11px] font-black tracking-[0.12em] uppercase bg-brand-brown text-white hover:bg-brand-orange active:scale-95 transition shadow-sm"
              >
                Buy now
              </button>
            </div>
          ) : (
            <p className="text-xs font-bold text-brand-brown/60">Not available to order right now.</p>
          )}
          {orderable && qty > 0 && !canAdd && <p className="text-[11px] font-bold text-brand-brown/60 text-center">{LIMIT_HINT}</p>}
        </div>
      </div>
    </article>
  );
}

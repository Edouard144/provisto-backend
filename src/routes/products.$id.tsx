import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Products, formatUSD, formatGEL, priceForQty } from "@/lib/api";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    cat: typeof s.cat === "string" ? s.cat : "",
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Product ${params.id} — Provisto` },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const { add } = useCart();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => Products.get(id),
  });

  const unit = useMemo(() => (product ? priceForQty(product, qty) : 0), [product, qty]);
  const total = unit * qty;

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-peach-soft/40" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-peach-soft/40" />
            <div className="h-4 w-full animate-pulse rounded bg-peach-soft/40" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-peach-soft/40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <p className="mt-2 text-muted-foreground">{(error as Error)?.message ?? "It may have been removed."}</p>
        <Link to="/products" className="btn-primary mt-6 inline-block">Back to catalog</Link>
      </div>
    );
  }

  const onAdd = () => {
    add(product, qty);
    toast.success(`Added ${qty} × ${product.name} to cart`);
  };

  return (
    <div className="container-page py-10 md:py-16">
      <Link to="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] border border-line bg-peach-soft/40 shadow-card">
          {product.images && product.images.length > 0 ? (
            <div className="relative">
              <img
                src={product.images[imgIndex].url}
                alt={product.images[imgIndex].alt ?? product.name}
                className="aspect-[4/5] w-full object-cover"
              />
              {product.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === imgIndex ? "bg-terracotta" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center font-display text-8xl text-terracotta/40">
              ◆
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>Hotel supply</span>
            {product.category && (
              <>
                <span>·</span>
                <span className="text-terracotta">{product.category.name}</span>
              </>
            )}
          </div>
          <h1 className="mt-2 font-display text-5xl md:text-6xl leading-[1.05]">{product.name}</h1>
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-8 flex items-baseline gap-4">
            <div>
              <div className="font-display text-5xl">{formatUSD(unit)}</div>
              <div className="text-xs text-muted-foreground">{formatGEL(unit)}</div>
            </div>
            <div className="text-sm text-muted-foreground">per unit · qty {qty}</div>
          </div>

          {/* Pricing tiers */}
          {product.pricingTiers && product.pricingTiers.length > 0 && (
            <div className="surface-card mt-6 overflow-hidden">
              <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Bulk pricing
              </div>
              <ul className="divide-y divide-line">
                {product.pricingTiers.map((t, i) => {
                  const active = qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty);
                  return (
                    <li
                      key={i}
                      className={
                        "flex items-center justify-between px-5 py-3 text-sm transition-colors " +
                        (active ? "bg-peach-soft/40 font-medium" : "")
                      }
                    >
                      <span className="flex items-center gap-2">
                        {active && <Check className="h-4 w-4 text-terracotta" />}
                        {t.minQty}{t.maxQty ? `–${t.maxQty}` : "+"} units
                      </span>
                      <span className="text-right">
                        <div className="font-display text-lg">{formatUSD(Number(t.price))}</div>
                        <div className="text-xs text-muted-foreground">{formatGEL(Number(t.price))}</div>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Qty + add */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-line bg-surface">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-12 w-12 place-items-center rounded-l-full hover:bg-peach-soft/40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="h-12 w-20 bg-transparent text-center font-medium outline-none"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-12 w-12 place-items-center rounded-r-full hover:bg-peach-soft/40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={onAdd} className="btn-primary h-12 px-6">
              Add to cart · {formatUSD(total)}
            </button>
            <div className="text-xs text-muted-foreground">{formatGEL(total)}</div>
          </div>

          {typeof product.stock === "number" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock — backorder available"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

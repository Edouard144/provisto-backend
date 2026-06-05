import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { formatUSD, formatGEL, priceForQty } from "@/lib/api";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const from = priceForQty(product, product.pricingTiers?.[0]?.minQty ?? 1);
  const bulk =
    product.pricingTiers && product.pricingTiers.length > 1
      ? Number(product.pricingTiers[product.pricingTiers.length - 1].price)
      : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    add(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleNavigate = () => {
    navigate({ to: "/products/$id", params: { id: product.id } });
  };

  return (
    <div
      onClick={handleNavigate}
      className="group surface-card overflow-hidden transition-transform duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-peach-soft/60">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-5xl text-terracotta/40">
            ◆
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ink backdrop-blur">
            {product.category.name}
          </span>
        )}
        {bulk !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-background">
            Bulk pricing
          </span>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 p-5">
        <h3 className="font-display text-xl leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">From</div>
            <div className="font-display text-xl text-ink">{formatUSD(from)}</div>
            <div className="text-xs text-muted-foreground">{formatGEL(from)}</div>
          </div>
          {bulk !== null && (
            <div className="text-right text-xs text-muted-foreground">
              <div>Bulk from</div>
              <div className="font-medium text-terracotta">{formatUSD(bulk)}</div>
              <div>{formatGEL(bulk)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
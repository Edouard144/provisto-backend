import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, Package, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-linens.jpg";
import { Products, Categories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Provisto — Hotel supplies by Kaya" },
      { name: "description", content: "Source linens, amenities and operations essentials for your property. Bulk pricing, fast shipping. By kaya.rent." },
      { property: "og:title", content: "Provisto — Hotel supplies by Kaya" },
      { property: "og:description", content: "Source linens, amenities and operations essentials for your property." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products } = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => Products.list(),
  });
  const featured = (products ?? []).slice(0, 4);

  const { data: cats } = useQuery({
    queryKey: ["categories", "home"],
    queryFn: () => Categories.list(),
  });
  const categories = (cats ?? []).slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="container-page pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="relative overflow-hidden rounded-[28px] border border-line/60 shadow-warm">
          <img
            src={heroImg}
            alt="Hotel linens, towels and amenity bottles arranged on warm cream linen"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/30 to-background/70" />
          <div className="relative grid min-h-[560px] gap-10 p-8 md:grid-cols-12 md:p-14">
            <div className="flex flex-col justify-between md:col-span-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink-soft backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> by kaya.rent
              </div>
              <div className="mt-8">
                <h1 className="font-display text-5xl leading-[0.95] md:text-7xl lg:text-8xl">
                  Outfit your<br />
                  <span className="italic text-terracotta">hotel</span>, end to end.
                </h1>
                <p className="mt-6 max-w-xl text-base text-ink-soft md:text-lg">
                  Linens, amenities and back-of-house essentials — sourced for
                  hospitality, priced for scale. One catalog, automatic bulk pricing,
                  delivered to your property.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                    Browse supplies <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/about" className="btn-ghost">How it works</Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-3 md:col-span-5">
              <div className="surface-card flex items-start gap-3 p-5">
                <Truck className="mt-0.5 h-5 w-5 text-terracotta" />
                <div>
                  <div className="font-medium">Property delivery</div>
                  <p className="text-sm text-muted-foreground">Pallets to single boxes, scheduled around your housekeeping windows.</p>
                </div>
              </div>
              <div className="surface-card flex items-start gap-3 p-5">
                <Package className="mt-0.5 h-5 w-5 text-terracotta" />
                <div>
                  <div className="font-medium">Bulk pricing, automatic</div>
                  <p className="text-sm text-muted-foreground">Tiered prices apply at checkout — order more, pay less, no negotiation.</p>
                </div>
              </div>
              <div className="surface-card flex items-start gap-3 p-5">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-terracotta" />
                <div>
                  <div className="font-medium">Hospitality grade</div>
                  <p className="text-sm text-muted-foreground">Specced for daily turnover — laundering, fade and tear tested.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Browse by use</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Everything your property runs on</h2>
          </div>
          <Link to="/products" className="hidden text-sm text-terracotta hover:underline md:inline">All categories →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card aspect-square animate-pulse bg-peach-soft/40" />
            ))
          ) : (
            categories.map((c, i) => (
              <Link
                key={c.id}
                to="/products"
                search={{ cat: c.id }}
                className="surface-card group relative flex aspect-square flex-col justify-between overflow-hidden p-6 transition-transform hover:-translate-y-1"
              >
                <span className="font-display text-3xl text-terracotta/30">0{i + 1}</span>
                <div>
                  <span className="font-display text-2xl">{c.name}</span>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm text-terracotta opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Featured</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Stocked this season</h2>
          </div>
          <Link to="/products" className="text-sm text-terracotta hover:underline">View all →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card aspect-[4/5] animate-pulse bg-peach-soft/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA STRIP */}
      <section className="container-page pb-24">
        <div className="surface-card flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between md:p-14">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open an account</div>
            <h3 className="mt-2 font-display text-3xl md:text-4xl">Buying for multiple properties?</h3>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Get bulk pricing automatically applied at checkout, plus order history per property.
            </p>
          </div>
          <Link to="/auth" className="btn-primary">Create an account</Link>
        </div>
      </section>
    </div>
  );
}

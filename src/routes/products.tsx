import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Products } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    cat: typeof s.cat === "string" ? s.cat : "",
  }),
  head: () => ({
    meta: [
      { title: "Catalog — Provisto" },
      { name: "description", content: "Browse hotel supplies: linens, amenities, housekeeping and F&B service. Bulk pricing applied automatically." },
      { property: "og:title", content: "Catalog — Provisto" },
      { property: "og:description", content: "Browse hotel supplies with automatic bulk pricing." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { q, cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  useEffect(() => { setSearch(q); }, [q]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", q, cat],
    queryFn: () => Products.list({ search: q || undefined, categoryId: cat || undefined }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: (s: { q: string; cat: string }) => ({ ...s, q: search }) });
  };

  return (
    <div className="container-page py-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Catalog</div>
          <h1 className="mt-2 font-display text-5xl md:text-6xl">Hotel supplies</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Every line item priced for scale — order more, pay less. Bulk tiers
            show on each product.
          </p>
        </div>
        <form onSubmit={submit} className="flex w-full max-w-md items-center gap-2 rounded-full border border-line bg-surface px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search towels, robes, soap…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="text-sm font-medium text-terracotta hover:underline">
            Search
          </button>
        </form>
      </div>

      <div className="mt-10">
        {error ? (
          <div className="surface-card p-8 text-center">
            <div className="font-display text-2xl">Couldn't load the catalog</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {(error as Error).message}. The backend may be waking up — try again in a moment.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="surface-card aspect-[4/5] animate-pulse bg-peach-soft/40" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div className="font-display text-3xl">No supplies matched</div>
            <p className="mt-2 text-muted-foreground">Try a different search or browse the full catalog.</p>
            <div className="mt-6">
              <Link to="/products" className="btn-ghost">Clear search</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data!.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

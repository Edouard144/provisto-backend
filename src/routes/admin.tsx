import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Products, Orders, Categories, Upload, formatUSD, type Product, type Order, type OrderStatus, type ProductInput, type Category } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Plus, Pencil, Trash2, X, ChevronDown, Upload as UploadIcon, FolderInput } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Provisto" }] }),
  component: Admin,
});

type Tab = "products" | "categories" | "orders";

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-peach-soft text-ink",
  paid: "bg-terracotta text-white",
  shipped: "bg-foreground text-background",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-line-strong text-muted-foreground",
};

function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("products");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [loading, user, navigate]);

  const productsQuery = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => Products.list(),
    enabled: !!user && user.role === "admin",
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => Orders.listAll(),
    enabled: !!user && user.role === "admin",
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => Categories.list(),
    enabled: !!user && user.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Products.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      Orders.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="container-page py-12">
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <div className="font-display text-3xl">Access denied</div>
          <p className="mt-2 text-muted-foreground">This area is for administrators only.</p>
          <Link to="/" className="btn-ghost mt-6 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin</div>
          <h1 className="mt-2 font-display text-5xl md:text-6xl">Dashboard</h1>
        </div>
      </div>

      <div className="mt-8 flex gap-4 border-b border-line">
        <button
          onClick={() => setTab("products")}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "products" ? "border-b-2 border-terracotta text-terracotta" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "categories" ? "border-b-2 border-terracotta text-terracotta" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "orders" ? "border-b-2 border-terracotta text-terracotta" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Orders
        </button>
      </div>

      <div className="mt-8">
        {tab === "products" && (
          <ProductsTab
            products={productsQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
            isLoading={productsQuery.isLoading}
            error={productsQuery.error}
            editProduct={editProduct}
            setEditProduct={setEditProduct}
            showNewForm={showNewForm}
            setShowNewForm={setShowNewForm}
            onDelete={(id) => { if (confirm("Delete this product?")) deleteMutation.mutate(id); }}
          />
        )}
        {tab === "categories" && (
          <CategoriesTab
            categories={categoriesQuery.data ?? []}
            isLoading={categoriesQuery.isLoading}
            error={categoriesQuery.error}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            orders={ordersQuery.data ?? []}
            isLoading={ordersQuery.isLoading}
            error={ordersQuery.error}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Products Tab ─────────────────────────────────────────────── */

function ProductsTab({
  products, categories, isLoading, error, editProduct, setEditProduct, showNewForm, setShowNewForm, onDelete,
}: {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  editProduct: Product | null;
  setEditProduct: (p: Product | null) => void;
  showNewForm: boolean;
  setShowNewForm: (v: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ProductInput) => Products.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setShowNewForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) => Products.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setEditProduct(null); },
  });

  const mutationError = createMutation.error || updateMutation.error;

  if (error) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="font-display text-2xl">Couldn't load products</div>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {mutationError && (
        <div className="surface-card mb-4 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {(mutationError as any)?.payload?.errors
            ? Object.entries((mutationError as any).payload.errors).map(([field, msgs]) => (
                <div key={field}><strong>{field}:</strong> {(msgs as string[]).join(", ")}</div>
              ))
            : (mutationError as Error).message}
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{products.length} product{products.length === 1 ? "" : "s"}</div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {showNewForm && (
        <ProductForm
          categories={categories}
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowNewForm(false)}
          saving={createMutation.isPending}
        />
      )}

      {editProduct && (
        <ProductForm
          categories={categories}
          initial={editProduct}
          onSave={(data) => updateMutation.mutate({ id: editProduct.id, data })}
          onCancel={() => setEditProduct(null)}
          saving={updateMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-card h-16 animate-pulse bg-peach-soft/30" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="font-display text-3xl">No products yet</div>
          <p className="mt-2 text-muted-foreground">Create your first product.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Price</th>
                <th className="pb-3 pr-4 font-medium">Stock</th>
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line/50">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {p.pricingTiers && p.pricingTiers.length > 0 ? formatUSD(Number(p.pricingTiers[0].price)) : "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.stock ?? "—"}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditProduct(p)} className="btn-ghost p-1.5" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="btn-ghost p-1.5 text-destructive" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Product Form ─────────────────────────────────────────────── */

function ProductForm({
  categories, initial, onSave, onCancel, saving,
}: {
  categories: Category[];
  initial?: Product;
  onSave: (data: ProductInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [existingImages, setExistingImages] = useState<Product["images"]>(initial?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const initialPrice = initial?.pricingTiers?.[0]?.price ?? "";
  const [price, setPrice] = useState(String(initialPrice));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeNewFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeExistingImage = (id: string) => {
    setExistingImages((prev) => prev?.filter((img) => img.id !== id) ?? []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let newUrls: string[] = [];
    if (newFiles.length > 0) {
      setUploading(true);
      try {
        newUrls = await Upload.images(newFiles);
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const images = [
      ...(existingImages?.map((img) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder })) ?? []),
      ...newUrls.map((url) => ({ url, alt: null, sortOrder: (existingImages?.length ?? 0) + 1 })),
    ];

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      images: images.length > 0 ? images : undefined,
      tiers: price ? [{ minQty: 1, maxQty: null, price: Number(price) }] : undefined,
      stock: stock ? Number(stock) : undefined,
      categoryId: categoryId.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="surface-card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-xl">{initial ? "Edit product" : "New product"}</span>
        <button type="button" onClick={onCancel} className="btn-ghost p-1.5"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field sm:col-span-2">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Stock</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div className="field sm:col-span-2">
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Images */}
        <div className="field sm:col-span-2">
          <label>Images</label>
          <div className="flex flex-wrap gap-3">
            {existingImages?.map((img) => (
              <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-line">
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previews.map((p, i) => (
              <div key={p} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-line">
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-line text-muted-foreground transition-colors hover:border-terracotta hover:text-terracotta">
              <UploadIcon className="h-6 w-6" />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleFiles} className="hidden" />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={saving || uploading} className="btn-primary text-sm">
          {uploading ? "Uploading…" : saving ? "Saving…" : initial ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

/* ─── Orders Tab ───────────────────────────────────────────────── */

function OrdersTab({
  orders, isLoading, error, onStatusChange,
}: {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const nextStatuses: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

  if (error) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="font-display text-2xl">Couldn't load orders</div>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card h-24 animate-pulse bg-peach-soft/30" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <div className="font-display text-3xl">No orders yet</div>
        <p className="mt-2 text-muted-foreground">Orders will appear here once customers place them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg">Order #{o.id.slice(0, 8)}</span>
              <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider " + statusColor[o.status]}>
                {o.status}
              </span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              {o.items && ` · ${o.items.length} item${o.items.length === 1 ? "" : "s"}`}
              {o.address && ` · ${o.address.slice(0, 40)}${o.address.length > 40 ? "…" : ""}`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-display text-xl">{formatUSD(Number(o.total))}</div>
            <div className="relative inline-block">
              <select
                value={o.status}
                onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
                className="appearance-none rounded-full border border-line bg-surface py-1.5 pl-3 pr-7 text-xs font-medium capitalize outline-none transition-colors focus:border-terracotta"
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Categories Tab ─────────────────────────────────────────────── */

function CategoriesTab({
  categories, isLoading, error,
}: {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: (name: string) => Categories.create({ name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); setName(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => Categories.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  if (error) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="font-display text-2xl">Couldn't load categories</div>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMutation.mutate(name.trim()); }}
        className="surface-card mb-6 flex items-center gap-3 p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-terracotta"
          required
        />
        <button type="submit" disabled={createMutation.isPending} className="btn-primary text-sm">
          {createMutation.isPending ? "Adding…" : "Add category"}
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card h-12 animate-pulse bg-peach-soft/30" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="font-display text-3xl">No categories yet</div>
          <p className="mt-2 text-muted-foreground">Create categories to organize your products.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="surface-card flex items-center justify-between p-4">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">/ {c.slug}</span>
              </div>
              <button
                onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                className="btn-ghost p-1.5 text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

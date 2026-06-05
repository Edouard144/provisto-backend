import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60 bg-surface-alt">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-2xl">
            <span className="text-terracotta">◆</span>
            <span>provisto</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Hotel supplies, sourced and shipped — linens, amenities, and operations
            essentials for properties of every size. By kaya.rent.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Shop
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-terracotta">All supplies</Link></li>
            <li><Link to="/cart" className="hover:text-terracotta">Cart</Link></li>
            <li><Link to="/account/orders" className="hover:text-terracotta">My orders</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Company
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-terracotta">About</Link></li>
            <li><a href="mailto:hello@kaya.rent" className="hover:text-terracotta">Contact</a></li>
            <li><a href="https://kaya.rent" className="hover:text-terracotta">kaya.rent</a></li>
          </ul>
        </div>
      </div>
      <div className="container-page border-t border-line/60 py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Provisto by Kaya. All prices in USD.
      </div>
    </footer>
  );
}

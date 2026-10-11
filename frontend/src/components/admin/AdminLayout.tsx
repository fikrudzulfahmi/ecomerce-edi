import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ListTree,
  LogOut,
  Megaphone,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produk', icon: Package },
  { to: '/admin/categories', label: 'Kategori', icon: ListTree },
  { to: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/vouchers', label: 'Voucher', icon: Ticket },
  { to: '/admin/banners', label: 'Banner', icon: Megaphone },
  { to: '/admin/chat', label: 'Pesan', icon: MessageCircle },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen bg-cream-dark/50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-cream-darker bg-white">
        <div className="border-b border-cream-darker p-5">
          <p className="text-lg font-bold text-navy">Edi's Store</p>
          <p className="mt-0.5 text-xs text-ink-muted">Panel Admin · {user?.name}</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-navy text-white' : 'text-ink-muted hover:bg-cream-dark'
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-cream-darker p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-cream-dark"
          >
            <Store className="h-4 w-4" /> Lihat Toko
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

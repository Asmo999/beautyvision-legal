import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, Bookmark, Users, ShoppingCart } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/brands', label: 'Brands', icon: Bookmark },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight">BV Admin</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

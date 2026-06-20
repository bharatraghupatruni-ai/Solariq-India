"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/format";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut,
  Sun
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis/new", label: "New Analysis", icon: PlusCircle },
  { href: "/reports", label: "My Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar min-h-screen flex flex-col hidden lg:flex flex-shrink-0">
        {/* Logo */}
        <div className="sidebar-logo flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(var(--primary-rgb),0.2)]">
            <Sun className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-gray-900 leading-none">SolarIQ</span>
            <span className="text-[7.5px] font-mono tracking-widest text-primary uppercase mt-0.5">Serene Grid</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 mt-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn("nav-item", isActive && "active")}>
                <Icon className="w-4.5 h-4.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="card-metric p-4 mt-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user.user_metadata?.full_name ?? "User"}
                </p>
                <p className="text-[9px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-[10px] font-semibold text-gray-500 hover:text-red-600 transition-colors w-full text-left flex items-center gap-2 pt-2.5 border-t border-gray-200/50 uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 flex justify-around items-center lg:hidden border-t border-gray-250/50 bg-white/95 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="flex-1 max-w-[80px]">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 py-1 rounded-xl transition-all",
                  isActive
                    ? "text-primary font-bold"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold tracking-tight">{label.split(" ")[0]}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

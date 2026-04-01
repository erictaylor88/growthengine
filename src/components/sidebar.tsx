"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ListTodo,
  Search,
  Users,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard, badgeKey: null },
  { label: "Queue", href: "/queue", icon: ListTodo, badgeKey: "pending" as const },
  { label: "Discovered", href: "/discovered", icon: Search, badgeKey: "discovered" as const },
  { label: "Communities", href: "/communities", icon: Users, badgeKey: null },
  { label: "Products", href: "/products", icon: Package, badgeKey: null },
  { label: "Analytics", href: "/analytics", icon: BarChart3, badgeKey: null },
];

type BadgeCounts = { pending: number; discovered: number };

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ pending: 0, discovered: 0 });

  useEffect(() => {
    const supabase = createClient();

    async function fetchCounts() {
      const [pendingRes, discoveredRes] = await Promise.all([
        supabase
          .from("content_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("discovered_threads")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
      ]);
      setBadges({
        pending: pendingRes.count ?? 0,
        discovered: discoveredRes.count ?? 0,
      });
    }

    fetchCounts();

    // Re-fetch counts when the page changes (user may have approved/skipped items)
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-[width] duration-200 ease-in-out",
        "bg-bg-raised border-border-subtle",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border-subtle px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[#09090B] font-semibold text-xs">
          G
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-[-0.02em] text-text-primary">
            GrowthEngine
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-accent-muted text-accent-text border-l-2 border-accent"
                      : "text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="rounded-full bg-accent-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent-text min-w-[20px] text-center">
                          {badgeCount}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute top-0.5 right-1 h-2 w-2 rounded-full bg-accent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border-subtle p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md py-2 text-text-tertiary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-secondary transition-colors duration-150"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

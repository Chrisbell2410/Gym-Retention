"use client";

import {
  Building2,
  KanbanSquare,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "@/components/ui/sign-out-button";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales Pipeline",
    items: [
      { href: "/prospects", label: "Prospects", icon: Building2 },
      { href: "/secret-shop", label: "Secret Shop", icon: Search },
      { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "/outreach", label: "Outreach", icon: Mail },
    ],
  },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <h2 className="px-3 text-xs font-semibold tracking-wider text-ink-400 uppercase">
            {group.label}
          </h2>
          <div className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-spark-500 text-white"
                      : "text-ink-200 hover:bg-ink-800 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SidebarNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-4 py-3 md:hidden">
        <Logo variant="dark" size={24} />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-2 text-ink-200 hover:bg-ink-800 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-ink-900">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo variant="dark" size={24} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-2 text-ink-200 hover:bg-ink-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-ink-800 p-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 md:flex">
        <div className="px-4 py-5">
          <Logo variant="dark" />
        </div>
        <NavLinks />
        <div className="border-t border-ink-800 p-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}

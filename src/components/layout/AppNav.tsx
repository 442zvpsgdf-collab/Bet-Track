"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/bets", label: "Historial", icon: "📋" },
  { href: "/bets/new", label: "Nueva apuesta", icon: "➕" },
  { href: "/bankroll", label: "Bankroll", icon: "💰" },
  { href: "/responsible-gambling", label: "Juego responsable", icon: "🛡️" },
  { href: "/settings", label: "Ajustes", icon: "⚙️" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-border bg-surface h-screen sticky top-0 p-4">
        <div className="px-2 py-3 mb-4">
          <span className="text-lg font-semibold tracking-tight">
            Bet<span className="text-primary">Track</span> MX
          </span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-white hover:bg-surface-alt"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-negative hover:bg-negative/10 transition"
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around items-center py-2 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

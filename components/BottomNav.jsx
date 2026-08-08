"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/messages", label: "Message", icon: "◌" },
  { href: "/profile", label: "Me", icon: "●" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-panel/95 backdrop-blur-lg pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-3">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link href={tab.href} className={`flex flex-col items-center gap-1 py-3.5 text-xs transition-colors active:opacity-70 ${active ? "text-emerald-400" : "text-mist"}`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xl ${active ? "bg-glow-gradient text-ink shadow-glow" : ""}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

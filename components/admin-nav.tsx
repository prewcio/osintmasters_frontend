"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Użytkownicy" },
    { href: "/admin/polls", label: "Ankiety" },
    { href: "/admin/news", label: "Aktualności" },
    { href: "/admin/meetings", label: "Spotkania" },
    { href: "/admin/materials", label: "Materiały" },
  ]

  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold glitch">ADMIN PANEL</h1>
          <nav>
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`hover:text-[#39FF14] transition-colors ${
                      pathname === item.href ? "text-[#39FF14]" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-[#39FF14] transition-colors"
                >
                  Powrót do strony głównej
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
} 
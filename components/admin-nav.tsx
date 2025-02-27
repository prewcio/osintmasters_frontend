"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminNav() {
  const pathname = usePathname() || ""

  const navItems = [
    { path: "/admin/users", label: "Użytkownicy" },
    { path: "/admin/polls", label: "Ankiety" },
    { path: "/admin/news", label: "Aktualności" },
    { path: "/admin/materials", label: "Materiały" },
    { path: "/admin/meetings", label: "Spotkania" },
  ]

  return (
    <nav className="bg-black/50 border-b border-gray-800 mb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center h-auto sm:h-14 py-4 sm:py-0">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm sm:text-base font-medium transition-colors hover:text-[#39FF14] ${
                  pathname === item.path
                    ? "text-[#39FF14]"
                    : "text-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
} 
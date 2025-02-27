"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar() {
  const pathname = usePathname() || ""
  const { user } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { path: "/dashboard", label: "DASHBOARD" },
    { path: "/dashboard/aktualnosci", label: "AKTUALNOŚCI" },
    { path: "/dashboard/ankiety", label: "ANKIETY" },
    { path: "/dashboard/materialy", label: "MATERIAŁY" },
    { path: "/dashboard/meetings", label: "SPOTKANIA" },
  ]

  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16">
          {/* Logo/Brand - Hidden on mobile when menu is open */}
          <div className="flex items-center py-4 sm:py-0">
            <Link 
              href="/dashboard" 
              className="text-xl sm:text-2xl font-bold glitch hover:text-[#39FF14] transition-colors"
            >
              OSINT MASTERS
            </Link>
          </div>

          {/* Navigation Links - Responsive menu */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 pb-4 sm:pb-0 w-full sm:w-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm sm:text-base font-medium transition-colors hover:text-[#39FF14] ${
                  isActive(item.path)
                    ? "text-[#39FF14]"
                    : "text-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`text-sm sm:text-base font-medium transition-colors hover:text-[#39FF14] ${
                  pathname.startsWith("/admin")
                    ? "text-[#39FF14]"
                    : "text-gray-300"
                }`}
              >
                ADMIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


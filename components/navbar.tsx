"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function Navbar({ activeVotes }: { activeVotes: number }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === "admin"

  const navItems = [
    { href: "/dashboard", label: "HOME" },
    { href: "/dashboard/aktualnosci", label: "AKTUALNOŚCI" },
    { href: "/dashboard/ankiety", label: "ANKIETY", badge: activeVotes },
    { href: "/dashboard/materialy", label: "MATERIAŁY" },
    { href: "/dashboard/chat", label: "CHAT" },
    { href: "/dashboard/settings", label: "USTAWIENIA" },
    ...(isAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
    { href: "/", label: "WYLOGUJ" }
  ]

  return (
    <div className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-4xl font-bold text-white text-center py-6 glitch">OSINT MASTERS</h1>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block pb-4">
          <ul className="flex justify-center space-x-8 text-gray-400">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`hover:text-white transition-colors flex items-center ${
                    pathname === item.href ? "text-[#39FF14]" : ""
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 text-[#39FF14] animate-pulse">{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between px-4 py-2 text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-md">
              <span>Menu</span>
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] mt-2 bg-black border border-gray-800">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={`w-full px-4 py-2 hover:text-[#39FF14] transition-colors flex items-center justify-between ${
                      pathname === item.href ? "text-[#39FF14]" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-2 text-[#39FF14] animate-pulse">{item.badge}</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  )
}


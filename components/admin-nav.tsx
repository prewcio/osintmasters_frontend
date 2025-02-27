"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Użytkownicy" },
    { href: "/admin/polls", label: "Ankiety" },
    { href: "/admin/news", label: "Aktualności" },
    { href: "/admin/meetings", label: "Spotkania" },
    { href: "/admin/materials", label: "Materiały" },
    { href: "/dashboard", label: "Powrót do strony głównej" }
  ]

  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between py-4">
          <h1 className="text-2xl font-bold glitch mb-4 md:mb-0">ADMIN PANEL</h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
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
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden w-full">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between px-4 py-2 text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-md">
                <span>Admin Menu</span>
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] mt-2 bg-black border border-gray-800">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={`w-full px-4 py-2 hover:text-[#39FF14] transition-colors ${
                        pathname === item.href ? "text-[#39FF14]" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </div>
  )
} 
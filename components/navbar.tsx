"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar({ activeVotes }: { activeVotes: number }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === "admin"

  return (
    <div className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center py-6 glitch">OSINT MASTERS</h1>
        <nav className="flex justify-center pb-4">
          <ul className="flex space-x-8 text-gray-400">
            <li>
              <Link
                href="/dashboard"
                className={`hover:text-white transition-colors ${pathname === "/dashboard" ? "text-[#39FF14]" : ""}`}
              >
                HOME
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/aktualnosci"
                className={`hover:text-white transition-colors ${pathname === "/dashboard/aktualnosci" ? "text-[#39FF14]" : ""}`}
              >
                AKTUALNOŚCI
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/ankiety"
                className={`hover:text-white transition-colors flex items-center ${pathname === "/dashboard/ankiety" ? "text-[#39FF14]" : ""}`}
              >
                ANKIETY
                {activeVotes > 0 && <span className="ml-2 text-[#39FF14] animate-pulse">{activeVotes}</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/materialy"
                className={`hover:text-white transition-colors ${pathname === "/dashboard/materialy" ? "text-[#39FF14]" : ""}`}
              >
                MATERIAŁY
              </Link>
            </li>
            {/* <li>
              <Link
                href="/dashboard/chat"
                className={`hover:text-white transition-colors ${pathname === "/dashboard/chat" ? "text-[#39FF14]" : ""}`}
              >
                CHAT
              </Link>
            </li> */}
            <li>
              <Link
                href="/dashboard/settings"
                className={`hover:text-white transition-colors ${pathname === "/dashboard/settings" ? "text-[#39FF14]" : ""}`}
              >
                USTAWIENIA
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className={`hover:text-white transition-colors ${pathname.startsWith("/admin") ? "text-[#39FF14]" : ""}`}
                >
                  ADMIN
                </Link>
              </li>
            )}
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                WYLOGUJ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}


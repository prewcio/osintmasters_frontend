import type React from "react"
import "./globals.css"
import { JetBrains_Mono } from "next/font/google"
import { AuthProvider } from "@/hooks/useAuth"

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "OSINT MASTERS",
  description: "Studenckie kółko naukowe OSINT Masters"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={jetbrainsMono.className}>
        <AuthProvider>
          <div className="scanline"></div>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'